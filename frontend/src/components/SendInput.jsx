import React, { useState, useRef, useEffect } from 'react'
import { IoSend } from "react-icons/io5";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from '../redux/messageSlice';
import { BASE_URL } from '../config';

const SendInput = () => {
    const [message, setMessage] = useState("");
    const dispatch = useDispatch();
    const { selectedUser } = useSelector(store => store.user);
    const { messages } = useSelector(store => store.message);
    const { socket } = useSelector(store => store.socket);
    const typingTimeoutRef = useRef(null);

    const handleInputChange = (e) => {
        setMessage(e.target.value);

        // Emit typing event (debounced)
        if (socket && selectedUser) {
            socket.emit('typing', { receiverId: selectedUser._id });

            // Clear previous timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { receiverId: selectedUser._id });
            }, 2000);
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Stop typing immediately on send
        if (socket && selectedUser) {
            socket.emit('stopTyping', { receiverId: selectedUser._id });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        try {
            const res = await axios.post(`${BASE_URL}/api/v1/message/send/${selectedUser?._id}`, { message }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            dispatch(setMessages([...messages, res?.data?.newMessage]))
        } catch (error) {
            console.log(error);
        }
        setMessage("");
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    return (
        <form onSubmit={onSubmitHandler} className='px-4 py-3 bg-[#1f2c33]'>
            <div className='w-full flex items-center gap-3'>
                <input
                    value={message}
                    onChange={handleInputChange}
                    type="text"
                    placeholder='Type a message'
                    className='flex-1 py-2.5 px-4 bg-[#2a3942] text-white text-sm rounded-lg border-none outline-none placeholder-gray-500'
                />
                <button type="submit" className='w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center hover:bg-[#06cf9c] transition-colors'>
                    <IoSend className='text-white' size={18} />
                </button>
            </div>
        </form>
    )
}

export default SendInput