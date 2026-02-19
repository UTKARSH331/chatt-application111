import React from 'react'
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from '../redux/userSlice';
import { clearNotificationsForUser } from '../redux/notificationSlice';

const OtherUser = ({ user }) => {
    const dispatch = useDispatch();
    const { selectedUser, onlineUsers } = useSelector(store => store.user);
    const { unreadCounts } = useSelector(store => store.notification);
    const isOnline = onlineUsers?.includes(user._id);
    const unread = unreadCounts[user._id] || 0;

    const selectedUserHandler = (user) => {
        dispatch(setSelectedUser(user));
        dispatch(clearNotificationsForUser(user._id));
    }

    return (
        <>
            <div
                onClick={() => selectedUserHandler(user)}
                className={`${selectedUser?._id === user?._id
                    ? 'bg-[#2a3942]'
                    : 'hover:bg-[#202c33]'
                    } flex gap-3 items-center rounded-lg px-3 py-2.5 cursor-pointer transition-colors mx-1`}
            >
                <div className='relative flex-shrink-0'>
                    <div className='w-12 h-12 rounded-full overflow-hidden'>
                        <img src={user?.profilePhoto} alt="user-profile" className='w-full h-full object-cover' />
                    </div>
                    {isOnline && (
                        <span className='absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]'></span>
                    )}
                </div>
                <div className='flex flex-col flex-1 min-w-0'>
                    <div className='flex justify-between items-center'>
                        <p className='text-white text-sm font-medium truncate'>{user?.fullName}</p>
                        {unread > 0 && (
                            <span className='bg-[#00a884] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                                {unread}
                            </span>
                        )}
                    </div>
                    <p className='text-gray-500 text-xs'>
                        {isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default OtherUser