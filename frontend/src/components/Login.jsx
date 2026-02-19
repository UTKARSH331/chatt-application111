import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from "react-hot-toast"
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setOtherUsers, setSelectedUser } from '../redux/userSlice';
import { setMessages } from '../redux/messageSlice';
import { BASE_URL } from '../config';

const Login = () => {
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authUser } = useSelector(store => store.user);

  // If already logged in, redirect to home
  useEffect(() => {
    if (authUser) {
      navigate("/");
    }
  }, [authUser, navigate]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!user.username || !user.password) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      // Clear any stale state from previous user before logging in
      dispatch(setSelectedUser(null));
      dispatch(setMessages(null));
      dispatch(setOtherUsers(null));

      const res = await axios.post(`${BASE_URL}/api/v1/user/login`, user, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (res.data.success) {
        toast.success("Welcome back!");
        dispatch(setAuthUser(res.data));
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
      console.log(error);
    } finally {
      setLoading(false);
      setUser({
        username: "",
        password: ""
      });
    }
  }
  return (
    <div className="min-w-96 mx-auto">
      <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 border border-gray-100'>
        <h1 className='text-3xl font-bold text-center'>Login</h1>
        <form onSubmit={onSubmitHandler}>

          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Username</span>
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className='w-full input input-bordered h-10'
              type="text"
              placeholder='Username'
              disabled={loading}
            />
          </div>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Password</span>
            </label>
            <input
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className='w-full input input-bordered h-10'
              type="password"
              placeholder='Password'
              disabled={loading}
            />
          </div>
          <p className='text-center my-2'>Don't have an account? <Link to="/signup" className='text-[#00a884] hover:underline'> signup </Link></p>
          <div>
            <button
              type="submit"
              className={`btn btn-block btn-sm mt-2 border border-slate-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login