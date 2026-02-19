import React, { useEffect } from 'react'
import Sidebar from './Sidebar'
import MessageContainer from './MessageContainer'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setSelectedUser } from '../redux/userSlice'

const HomePage = () => {
  const { authUser } = useSelector(store => store.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  // Don't render anything until we confirm auth - prevents Sidebar crash with null data
  if (!authUser) {
    return null;
  }

  return (
    <div className='flex h-[90vh] w-full max-w-[1200px] rounded-xl overflow-hidden shadow-2xl border border-[#2a3942]'>
      <Sidebar />
      <MessageContainer />
    </div>
  )
}

export default HomePage
