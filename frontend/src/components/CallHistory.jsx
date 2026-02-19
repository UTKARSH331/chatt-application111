import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { IoCall, IoArrowDown, IoArrowUp, IoClose } from 'react-icons/io5';

const CallHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                axios.defaults.withCredentials = true;
                const res = await axios.get(`${BASE_URL}/api/v1/user/calls/history`);
                setHistory(res.data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchHistory();
    }, []);

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#111b21] text-white">
            <h2 className="text-xl font-bold p-4 border-b border-[#2a3942] sticky top-0 bg-[#1f2c33]">Call History</h2>
            <div className="flex-1 overflow-auto">
                {history.length > 0 ? (
                    history.map((call) => (
                        <div key={call._id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#202c33] cursor-pointer transition-colors border-b border-[#2a3942]/50">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#2a3942]">
                                    <img
                                        src={call.peerId?.profilePhoto || 'https://avatar.iran.liara.run/public'}
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-[#1f2c33] rounded-full p-0.5">
                                    {call.type === 'incoming' ? (
                                        call.status === 'missed' ? (
                                            <IoClose className="text-red-500 w-4 h-4" />
                                        ) : (
                                            <IoArrowDown className="text-green-500 w-4 h-4" />
                                        )
                                    ) : (
                                        <IoArrowUp className="text-blue-500 w-4 h-4" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-base">{call.peerId?.fullName || "Unknown"}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs ${call.status === 'missed' ? 'text-red-400' : 'text-gray-400'}`}>
                                        {call.status === 'missed' ? 'Missed Call' : call.type === 'outgoing' ? 'Outgoing' : 'Incoming'}
                                    </span>
                                    <span className="text-gray-600 text-[10px]">•</span>
                                    <span className="text-gray-500 text-xs">{formatTime(call.startedAt)}</span>
                                </div>
                            </div>
                            <button className="text-[#00a884] hover:bg-[#2a3942] p-2 rounded-full transition-colors">
                                <IoCall className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <IoCall className="w-12 h-12 opacity-20" />
                        <p>No call history yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistory;
