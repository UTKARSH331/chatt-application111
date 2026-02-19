import Signup from './components/Signup';
import './App.css';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from './components/HomePage';
import Login from './components/Login';
import VoiceCall from './components/VoiceCall';
import { useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { setSocket } from './redux/socketSlice';
import { setOnlineUsers } from './redux/userSlice';
import { addNotification } from './redux/notificationSlice';
import { updateMessageParams } from './redux/messageSlice';
import { BASE_URL } from './config';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/login",
    element: <Login />
  },
])

function App() {
  const { authUser } = useSelector(store => store.user);
  const { socket } = useSelector(store => store.socket);
  const dispatch = useDispatch();

  useEffect(() => {
    if (authUser) {
      const socketio = io(`${BASE_URL}`, {
        query: {
          userId: authUser._id
        }
      });
      dispatch(setSocket(socketio));

      socketio?.on('getOnlineUsers', (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers))
      });

      // Listen for notifications
      socketio?.on('notification', (notification) => {
        dispatch(addNotification(notification));
      });

      // Listen for message deletion
      socketio.on('messageDeleted', ({ messageId, everyone }) => {
        dispatch(updateMessageParams({ messageId, deletedForEveryone: everyone }));
      });

      return () => {
        socketio.removeAllListeners();
        socketio.close();
        dispatch(setSocket(null));
      };
    } else {
      if (socket) {
        socket.removeAllListeners?.();
        socket.close();
        dispatch(setSocket(null));
      }
    }
  }, [authUser, dispatch, socket]);

  return (
    <div className="p-4 h-screen flex items-center justify-center">
      <RouterProvider router={router} />
      {/* Voice Call overlay renders globally */}
      <VoiceCall />
    </div>
  );
}

export default App;
