import React, { useEffect, useState } from 'react'
import SendInput from './SendInput'
import Messages from './Messages';
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from '../redux/userSlice';
import { IoCall, IoArrowBack } from 'react-icons/io5';

const MessageContainer = () => {
    const { selectedUser, authUser, onlineUsers } = useSelector(store => store.user);
    const { socket } = useSelector(store => store.socket);
    const dispatch = useDispatch();
    const [isTyping, setIsTyping] = useState(false);

    const isOnline = onlineUsers?.includes(selectedUser?._id);

    // Listen for typing events
    useEffect(() => {
        if (!socket || !selectedUser) return;

        const handleTyping = ({ senderId }) => {
            if (senderId === selectedUser._id) setIsTyping(true);
        };
        const handleStopTyping = ({ senderId }) => {
            if (senderId === selectedUser._id) setIsTyping(false);
        };

        socket.on('userTyping', handleTyping);
        socket.on('userStopTyping', handleStopTyping);

        return () => {
            socket.off('userTyping', handleTyping);
            socket.off('userStopTyping', handleStopTyping);
        };
    }, [socket, selectedUser]);

    // Tell server which chat we're viewing (for notification tracking)
    useEffect(() => {
        if (socket && selectedUser) {
            socket.emit('setActiveChat', selectedUser._id);
        }
        return () => {
            if (socket) socket.emit('clearActiveChat');
        };
    }, [socket, selectedUser]);

    const handleVoiceCall = () => {
        if (window.__initiateVoiceCall && selectedUser) {
            window.__initiateVoiceCall(selectedUser._id, selectedUser.fullName);
        }
    };

    return (
        <>
            {
                selectedUser !== null ? (
                    <div className='flex-1 flex flex-col bg-[#0b141a]'>
                        {/* Chat Header */}
                        <div className='flex items-center gap-3 bg-[#1f2c33] text-white px-4 py-2.5 shadow-sm'>
                            <button
                                onClick={() => dispatch(setSelectedUser(null))}
                                className='md:hidden text-gray-400 hover:text-white mr-1'
                            >
                                <IoArrowBack size={20} />
                            </button>
                            <div className='relative'>
                                <div className='w-10 h-10 rounded-full overflow-hidden'>
                                    <img src={selectedUser?.profilePhoto} alt="user-profile" className='w-full h-full object-cover' />
                                </div>
                                {isOnline && (
                                    <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#1f2c33]'></span>
                                )}
                            </div>
                            <div className='flex flex-col flex-1'>
                                <p className='font-medium text-sm'>{selectedUser?.fullName}</p>
                                <p className='text-xs text-gray-400'>
                                    {isTyping ? (
                                        <span className='text-[#00a884] font-medium'>typing...</span>
                                    ) : isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                            {/* Voice Call Button */}
                            <button
                                onClick={handleVoiceCall}
                                className='w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-[#00a884] hover:bg-[#2a3942] transition-all'
                                title='Voice Call'
                            >
                                <IoCall size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <Messages />

                        {/* Typing Indicator Bubble */}
                        {isTyping && (
                            <div className='px-4 pb-1'>
                                <div className='inline-flex items-center gap-1 bg-[#1f2c33] rounded-2xl px-4 py-2'>
                                    <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
                                    <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
                                    <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}

                        <SendInput />
                    </div>
                ) : (
                    <div className='flex-1 flex flex-col justify-center items-center bg-[#0b141a]'>
                        <div className='text-center'>
                            <div className='w-20 h-20 rounded-full bg-[#1f2c33] flex items-center justify-center mx-auto mb-4'>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h1 className='text-2xl text-white font-bold'>Hi, {authUser?.fullName}</h1>
                            <p className='text-gray-400 mt-2'>Select a conversation to start chatting</p>
                        </div>
                    </div>
                )
            }
        </>
    )
}

export default MessageContainer