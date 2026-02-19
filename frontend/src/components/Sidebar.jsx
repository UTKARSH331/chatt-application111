import React, { useState, useEffect } from 'react'
import { BiSearchAlt2 } from "react-icons/bi";
import OtherUsers from './OtherUsers';
import ProfileModal from './ProfileModal';
import CallHistory from './CallHistory';
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setOtherUsers, setSelectedUser, logoutAccount } from '../redux/userSlice'; // Import logoutAccount
import { setMessages } from '../redux/messageSlice';
import { setSocket } from '../redux/socketSlice';
import { clearNotificationsForUser } from '../redux/notificationSlice';
import { persistor } from '../redux/store';
import { BASE_URL } from '../config';
import { IoLogOutOutline, IoCall, IoChatbubbleEllipses, IoChevronDown, IoAddCircleOutline, IoPersonCircleOutline } from 'react-icons/io5';

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("chats"); // "chats", "all", "calls"
    const [conversations, setConversations] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false); // Account Switcher
    const { otherUsers, authUser, availableAccounts, onlineUsers } = useSelector(store => store.user); // Get availableAccounts and onlineUsers
    const { unreadCounts } = useSelector(store => store.notification);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                axios.defaults.withCredentials = true;
                const res = await axios.get(`${BASE_URL}/api/v1/user/conversations`);
                setConversations(res.data);
            } catch (error) {
                console.log(error);
            }
        };
        if (activeTab === 'chats' && authUser) fetchConversations();
    }, [activeTab, unreadCounts, authUser]);

    const logoutHandler = async () => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${BASE_URL}/api/v1/user/logout`);

            // 1. Clear local storage cache (redux-persist)
            await persistor.purge();

            // 2. Clear Redux state
            dispatch(logoutAccount());
            dispatch(setMessages(null));
            dispatch(setOtherUsers(null));
            dispatch(setSelectedUser(null));
            dispatch(setSocket(null));

            navigate("/login");
            toast.success(res.data.message);
        } catch (error) {
            console.log(error);
        }
    }

    const switchAccountHandler = async (account) => {
        if (account._id === authUser._id) {
            setShowAccountMenu(false);
            return;
        }
        // Force a clean logout before switching
        await logoutHandler();
    };

    const addAccountHandler = async () => {
        // Force a clean logout before adding new
        await logoutHandler();
    };


    const searchSubmitHandler = (e) => {
        e.preventDefault();
        const conversationUser = otherUsers?.find((user) => user.fullName.toLowerCase().includes(search.toLowerCase()));
        if (conversationUser) {
            dispatch(setOtherUsers([conversationUser]));
            setActiveTab('all');
        } else {
            toast.error("User not found!");
        }
    }

    const handleSelectConversation = (user) => {
        dispatch(setSelectedUser(user));
        dispatch(clearNotificationsForUser(user._id));
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className='border-r border-[#2a3942] flex flex-col w-[320px] bg-[#111b21] relative'>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3 bg-[#1f2c33] z-20 relative'>
                <div
                    className='flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#2a3942] transition-colors relative'
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                >
                    <div className='w-10 h-10 rounded-full overflow-hidden border-2 border-[#00a884]'>
                        <img
                            src={authUser?.profilePhoto || 'https://avatar.iran.liara.run/public'}
                            alt="avatar"
                            className='w-full h-full object-cover'
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className='text-white font-medium text-sm flex items-center gap-1'>
                            {authUser?.fullName}
                            <IoChevronDown size={14} className={`transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} />
                        </span>
                        <span className="text-[10px] text-gray-400">@{authUser?.username}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowProfile(true)} className='text-gray-400 hover:text-white transition-colors' title="Profile">
                        <IoPersonCircleOutline size={24} />
                    </button>
                    <button onClick={logoutHandler} className='text-gray-400 hover:text-white transition-colors' title="Logout">
                        <IoLogOutOutline size={24} />
                    </button>
                </div>

                {/* Account Switcher Dropdown */}
                {showAccountMenu && (
                    <div className="absolute top-16 left-4 bg-[#233138] w-64 rounded-lg shadow-xl border border-[#2a3942] py-2 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Accounts</div>

                        {availableAccounts && availableAccounts.map(acc => (
                            <button
                                key={acc._id}
                                onClick={() => switchAccountHandler(acc)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#182229] transition-colors ${acc._id === authUser._id ? 'bg-[#2a3942]' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-600 relative">
                                    <img src={acc.profilePhoto} alt="" className="w-full h-full object-cover" />
                                    {onlineUsers?.includes(acc._id) && (
                                        <span className='absolute bottom-0 right-0 w-2 h-2 bg-[#00a884] rounded-full border-2 border-[#233138]'></span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm ${acc._id === authUser._id ? 'text-[#00a884] font-medium' : 'text-[#e9edef]'}`}>
                                        {acc.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">@{acc.username}</p>
                                </div>
                                {acc._id === authUser._id && <div className="ml-auto w-2 h-2 bg-[#00a884] rounded-full"></div>}
                            </button>
                        ))}

                        <div className="border-t border-[#2a3942] my-1"></div>

                        <button
                            onClick={addAccountHandler}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#182229] text-[#e9edef] transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center text-gray-400">
                                <IoAddCircleOutline size={20} />
                            </div>
                            <span className="text-sm font-medium">Add Account</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Backdrop for menu */}
            {showAccountMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setShowAccountMenu(false)}></div>
            )}


            {/* Search */}
            <div className='px-3 py-2'>
                <form onSubmit={searchSubmitHandler} className='flex items-center gap-2'>
                    <div className='flex-1 relative'>
                        <BiSearchAlt2 className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='w-full pl-10 pr-3 py-2 bg-[#202c33] text-white text-sm rounded-lg border-none outline-none placeholder-gray-500'
                            type="text"
                            placeholder='Search or start new chat'
                        />
                    </div>
                </form>
            </div>

            {/* Tabs */}
            <div className='flex border-b border-[#2a3942] bg-[#1f2c33]'>
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 py-3 transition-colors relative ${activeTab === 'chats' ? 'text-[#00a884]' : 'text-gray-400 hover:text-white'}`}
                >
                    <IoChatbubbleEllipses size={24} className="mx-auto" />
                    {activeTab === 'chats' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#00a884]"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('calls')}
                    className={`flex-1 py-3 transition-colors relative ${activeTab === 'calls' ? 'text-[#00a884]' : 'text-gray-400 hover:text-white'}`}
                >
                    <IoCall size={24} className="mx-auto" />
                    {activeTab === 'calls' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#00a884]"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-[#00a884]' : 'text-gray-400 hover:text-white'}`}
                >
                    Contacts
                    {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#00a884]"></span>}
                </button>
            </div>

            {/* Content */}
            <div className='overflow-auto flex-1 custom-scrollbar'>
                {activeTab === 'chats' ? (
                    conversations.length > 0 ? conversations.map((conv) => (
                        <div
                            key={conv._id}
                            onClick={() => handleSelectConversation(conv.user)}
                            className='flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer transition-colors border-b border-[#2a3942]/50'
                        >
                            <div className='w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative'>
                                <img src={conv.user?.profilePhoto} alt="" className='w-full h-full object-cover' />
                                {onlineUsers?.includes(conv.user?._id) && (
                                    <span className='absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]'></span>
                                )}
                            </div>
                            <div className='flex-1 min-w-0'>
                                <div className='flex justify-between items-center'>
                                    <p className='text-white text-sm font-medium truncate'>{conv.user?.fullName}</p>
                                    <span className='text-gray-500 text-xs flex-shrink-0'>
                                        {formatTime(conv.lastMessage?.createdAt)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center mt-0.5'>
                                    <p className='text-gray-400 text-xs truncate max-w-[180px]'>
                                        {conv.lastMessage?.text || 'No messages yet'}
                                    </p>
                                    {unreadCounts[conv.user?._id] > 0 && (
                                        <span className='ml-2 flex-shrink-0 bg-[#00a884] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold'>
                                            {unreadCounts[conv.user?._id]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className='flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-4 text-center'>
                            <p className="text-sm">No conversations yet.</p>
                            <button onClick={() => setActiveTab('all')} className="text-[#00a884] text-sm hover:underline">
                                Start a chat
                            </button>
                        </div>
                    )
                ) : activeTab === 'calls' ? (
                    <CallHistory />
                ) : (
                    <OtherUsers />
                )}
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        </div>
    )
}

export default Sidebar