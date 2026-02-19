import { useEffect } from 'react'
import Sidebar from './Sidebar'
import MessageContainer from './MessageContainer'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'


const HomePage = () => {
  const { authUser } = useSelector(store => store.user);
  const navigate = useNavigate();


  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
