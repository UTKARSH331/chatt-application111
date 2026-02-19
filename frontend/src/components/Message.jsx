import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from "react-redux";
import { BsCheckAll } from "react-icons/bs";
import { IoChevronDown } from "react-icons/io5";
import axios from "axios";
import { BASE_URL } from '../config';
import { updateMessageParams, removeMessage } from '../redux/messageSlice';
import toast from "react-hot-toast";

const Message = ({ message }) => {
    const scroll = useRef();
    const { authUser, selectedUser } = useSelector(store => store.user);
    const dispatch = useDispatch();
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        scroll.current?.scrollIntoView({ behavior: "smooth" });
    }, [message]);

    const isSent = message?.senderId === authUser?._id;
    const isDeleted = message?.deletedForEveryone;

    // Check handling (Mock logic for now as strictly read receipts need more backend work)
    // If sent by me and user is selected (which means they are viewing), show blue ticks
    // This is a simplification. Real implementation needs 'read' status in message model.
    const isRead = true; // Assuming read if viewed for now

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (isDeleted) return;
        setMenuPosition({ top: e.clientY, left: e.clientX });
        setShowMenu(true);
    };

    const handleDelete = async (everyone) => {
        try {
            axios.defaults.withCredentials = true;
            await axios.delete(`${BASE_URL}/api/v1/message/${message._id}`, {
                data: { everyone }
            });

            if (everyone) {
                dispatch(updateMessageParams({ messageId: message._id, deletedForEveryone: true }));
            } else {
                dispatch(removeMessage(message._id));
            }
            setShowMenu(false);
            toast.success("Message deleted");
        } catch (error) {
            console.log(error);
            toast.error("Failed to delete");
        }
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClick = () => setShowMenu(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div
            ref={scroll}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1 px-2 group relative`}
            onContextMenu={handleContextMenu}
        >
            <div className={`flex items-end gap-1.5 max-w-[65%]`}>
                {/* Avatar (only for received) */}
                {!isSent && (
                    <div className='w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1'>
                        <img
                            src={selectedUser?.profilePhoto}
                            alt=""
                            className='w-full h-full object-cover'
                        />
                    </div>
                )}

                <div
                    className={`relative px-3 py-1.5 rounded-lg shadow-sm ${isSent
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#1f2c33] text-[#e9edef] rounded-tl-none'
                        } ${isDeleted ? 'italic text-gray-400' : ''}`}
                >
                    {/* Message Content */}
                    <div className="flex flex-col relative">
                        {isDeleted && <span className="mr-1 inline-block pb-1">🚫</span>}
                        <p className={`text-sm leading-relaxed ${isDeleted ? 'text-gray-400 italic' : ''}`}>
                            {message?.message}
                        </p>

                        {/* Metadata (Time + Ticks) */}
                        <div className="flex items-center justify-end gap-1 mt-0.5 select-none">
                            <span className={`text-[10px] ${isSent ? 'text-gray-300' : 'text-gray-500'}`}>
                                {formatTime(message?.createdAt)}
                            </span>
                            {isSent && !isDeleted && (
                                <span className={isRead ? 'text-[#53bdeb]' : 'text-gray-400'}>
                                    <BsCheckAll size={16} />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Context Menu Trigger (Arrow) - Visible on Hover */}
                    {!isDeleted && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setMenuPosition({ top: e.clientY + 10, left: e.clientX - 100 }) }}
                            className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-black/20 to-transparent rounded-tr-lg"
                        >
                            <IoChevronDown className="text-gray-300 hover:text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {showMenu && (
                <div
                    className="fixed z-50 bg-[#233138] rounded-md shadow-xl py-2 w-48 border border-[#2a3942]"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDelete(false)}
                        className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm"
                    >
                        Delete for me
                    </button>
                    {isSent && (
                        <button
                            onClick={() => handleDelete(true)}
                            className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm"
                        >
                            Delete for everyone
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default Message
