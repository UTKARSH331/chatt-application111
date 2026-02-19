import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from '../config';


const Signup = () => {
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckbox = (gender) => {
    setUser({ ...user, gender });
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!user.fullName || !user.username || !user.password || !user.confirmPassword || !user.gender) {
      toast.error("All fields are required");
      return;
    }

    if (user.password !== user.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/user/register`, user, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed. Please try again.");
      console.log(error);
    } finally {
      setLoading(false);
      setUser({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        gender: "",
      });
    }
  }
  return (
    <div className="min-w-96 mx-auto">
      <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 border border-gray-100'>
        <h1 className='text-3xl font-bold text-center'>Signup</h1>
        <form onSubmit={onSubmitHandler}>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Full Name</span>
            </label>
            <input
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              className='w-full input input-bordered h-10'
              type="text"
              placeholder='Full Name'
              disabled={loading}
            />
          </div>
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
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Confirm Password</span>
            </label>
            <input
              value={user.confirmPassword}
              onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
              className='w-full input input-bordered h-10'
              type="password"
              placeholder='Confirm Password'
              disabled={loading}
            />
          </div>
          <div className='flex items-center my-4 gap-4'>
            <div className='flex items-center cursor-pointer' onClick={() => handleCheckbox("male")}>
              <p className='text-sm'>Male</p>
              <input
                type="radio"
                name="gender"
                checked={user.gender === "male"}
                onChange={() => handleCheckbox("male")}
                className="radio radio-primary mx-2 scale-75"
                disabled={loading}
              />
            </div>
            <div className='flex items-center cursor-pointer' onClick={() => handleCheckbox("female")}>
              <p className='text-sm'>Female</p>
              <input
                type="radio"
                name="gender"
                checked={user.gender === "female"}
                onChange={() => handleCheckbox("female")}
                className="radio radio-primary mx-2 scale-75"
                disabled={loading}
              />
            </div>
          </div>
          <p className='text-center my-2'>Already have an account? <Link to="/login" className='text-[#00a884] hover:underline'> login </Link></p>
          <div>
            <button
              type='submit'
              className={`btn btn-block btn-sm mt-2 border border-slate-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Signup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup