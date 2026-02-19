import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setIncomingCall, setActiveCall, endCall, addToCallHistory, setCallStatus } from '../redux/callSlice';
import { IoCall, IoClose, IoMicOff, IoMic, IoPersonAdd, IoArrowBack } from 'react-icons/io5';

const VoiceCall = () => {
    const { incomingCall, activeCall, callStatus } = useSelector(store => store.call);
    const { socket } = useSelector(store => store.socket);
    const { authUser } = useSelector(store => store.user);
    const dispatch = useDispatch();

    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);

    // ICE servers for WebRTC
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // --- Cleanup ---
    const cleanupCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setCallDuration(0);
        setIsMuted(false);
        // Remove active call UI
        // dispatch(endCall()); // This is called by caller
    }, [dispatch]);

    const startTimer = useCallback(() => {
        if (!timerRef.current) {
            setCallDuration(0);
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
    }, []);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- WebRTC Logic ---
    const createPeerConnection = useCallback((targetSocketId) => {
        const pc = new RTCPeerConnection(iceServers);

        // Add local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    to: authUser._id === targetSocketId ? activeCall?.peerId : targetSocketId, // Allow flexible target? No, standard P2P
                    // Actually target is whoever we are calling. 
                    // If we are caller, target is receiver. If receiver, target is caller.
                    // For initiate: target is receiver.
                    // For answer: target is caller (incomingCall.from)
                    candidate: event.candidate
                });
                // Fix: The 'to' in emit should be the other person's ID.
                // We need to know who we are talking to.
                // activeCall should have peerId.
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            const remoteAudio = document.getElementById('remote-audio');
            if (remoteAudio) {
                remoteAudio.srcObject = event.streams[0];
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, activeCall, authUser]);


    // --- 1. Global Initiator (Exposed to Window) ---
    useEffect(() => {
        window.__initiateVoiceCall = async (receiverId, receiverName, receiverPhoto) => {
            if (!socket) return;
            try {
                // 1. Get User Media
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;

                // 2. Create Peer Connection
                const pc = new RTCPeerConnection(iceServers);
                peerConnectionRef.current = pc;

                // Add tracks
                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                // Handle ICE
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('iceCandidate', { to: receiverId, candidate: event.candidate });
                    }
                };

                // Handle Remote Stream
                pc.ontrack = (event) => {
                    const remoteAudio = document.getElementById('remote-audio');
                    if (remoteAudio) remoteAudio.srcObject = event.streams[0];
                };

                // 3. Create Offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // 4. Emit Call Signal
                socket.emit('callUser', {
                    to: receiverId,
                    offer,
                    callerName: authUser.fullName,
                    callerPhoto: authUser.profilePhoto
                });

                // 5. Update UI state
                dispatch(setActiveCall({ peerId: receiverId, peerName: receiverName, peerPhoto: receiverPhoto })); // Custom payload to store details
                dispatch(setCallStatus('calling')); // Let's use 'calling' for outgoing ringing

            } catch (err) {
                console.error("Error starting call:", err);
                alert("Could not access microphone.");
            }
        };

        return () => {
            delete window.__initiateVoiceCall;
        }
    }, [socket, authUser, dispatch]);


    // --- 2. Socket Listeners ---
    useEffect(() => {
        if (!socket) return;

        // Incoming Call
        socket.on('incomingCall', (data) => {
            // data: { from, callerName, callerPhoto, offer }
            dispatch(setIncomingCall(data));
        });

        // Call Answered (We are the caller)
        socket.on('callAnswered', async ({ answer }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                dispatch(setCallStatus('active'));
                startTimer();
            }
        });

        // ICE Candidate
        socket.on('iceCandidate', async ({ candidate }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            }
        });

        // Call Ended
        socket.on('callEnded', () => {
            dispatch(addToCallHistory({
                caller: activeCall?.peerName || incomingCall?.callerName || "Unknown",
                type: 'incoming', // Technically if we are ended on, it was an incoming or outgoing interaction
                duration: callDuration,
                timestamp: new Date().toISOString()
            }));
            cleanupCall();
            dispatch(endCall());
        });

        // Call Rejected
        socket.on('callRejected', () => {
            dispatch(addToCallHistory({
                caller: activeCall?.peerName || "Unknown",
                type: 'outgoing', // We were the caller
                status: 'missed',
                timestamp: new Date().toISOString()
            }));
            cleanupCall();
            dispatch(endCall());
            alert("Call declined");
        });

        return () => {
            socket.off('incomingCall');
            socket.off('callAnswered');
            socket.off('iceCandidate');
            socket.off('callEnded');
            socket.off('callRejected');
        };
    }, [socket, dispatch, activeCall, incomingCall, callDuration, cleanupCall, startTimer]);


    // --- 3. User Actions ---

    const handleAcceptCall = async () => {
        if (!incomingCall || !socket) return;
        try {
            // 1. Get User Media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            // 2. Create Peer Connection
            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('iceCandidate', { to: incomingCall.from, candidate: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                const remoteAudio = document.getElementById('remote-audio');
                if (remoteAudio) remoteAudio.srcObject = event.streams[0];
            };

            // 3. Set Remote Description (Offer)
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            // 4. Create Answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // 5. Emit Answer
            socket.emit('answerCall', { to: incomingCall.from, answer });

            // 6. Update UI
            dispatch(setActiveCall({
                peerId: incomingCall.from,
                peerName: incomingCall.callerName,
                peerPhoto: incomingCall.callerPhoto
            }));
            startTimer();

        } catch (err) {
            console.error("Error answering call:", err);
        }
    };

    const handleRejectCall = () => {
        if (incomingCall && socket) {
            socket.emit('rejectCall', { to: incomingCall.from });
            dispatch(endCall());
        }
    };

    const handleEndCall = () => {
        const targetId = activeCall?.peerId || incomingCall?.from;
        if (targetId && socket) {
            socket.emit('endCall', { to: targetId });
        }
        // Log locally
        dispatch(addToCallHistory({
            caller: activeCall?.peerName || "Unknown",
            type: 'outgoing',
            duration: callDuration,
            timestamp: new Date().toISOString()
        }));
        cleanupCall();
        dispatch(endCall());
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // --- Render ---
    if (callStatus === 'idle') return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <audio id="remote-audio" autoPlay className="hidden" />

            <div className="bg-[#1f2c33] rounded-3xl p-8 w-[350px] shadow-2xl border border-[#2a3942] flex flex-col items-center">

                {/* Outgoing Ringing UI */}
                {callStatus === 'calling' && (
                    <>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00a884] mb-4 relative">
                            <img src={activeCall?.peerPhoto || 'https://avatar.iran.liara.run/public'} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/20 animate-pulse"></div>
                        </div>
                        <h3 className="text-white text-2xl font-semibold mb-1">{activeCall?.peerName}</h3>
                        <p className="text-[#00a884] animate-pulse mb-8">Calling...</p>

                        <button onClick={handleEndCall} className="bg-red-500 p-4 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                            <IoCall className="text-white text-2xl transform rotate-[135deg]" />
                        </button>
                    </>
                )}

                {/* Incoming Ringing UI */}
                {callStatus === 'ringing' && incomingCall && (
                    <>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00a884] mb-4 animate-bounce">
                            <img src={incomingCall.callerPhoto || 'https://avatar.iran.liara.run/public'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <h3 className="text-white text-2xl font-semibold mb-1">{incomingCall.callerName}</h3>
                        <p className="text-[#00a884] mb-8">Incoming Audio Call...</p>

                        <div className="flex gap-8">
                            <button onClick={handleRejectCall} className="bg-red-500 p-4 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <IoCall className="text-white text-2xl transform rotate-[135deg]" />
                            </button>
                            <button onClick={handleAcceptCall} className="bg-green-500 p-4 rounded-full hover:bg-green-600 transition-colors shadow-lg animate-pulse">
                                <IoCall className="text-white text-2xl" />
                            </button>
                        </div>
                    </>
                )}

                {/* Active Call UI */}
                {callStatus === 'active' && (
                    <>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00a884] mb-4">
                            <img src={activeCall?.peerPhoto || (incomingCall?.callerPhoto) || 'https://avatar.iran.liara.run/public'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <h3 className="text-white text-2xl font-semibold mb-1">
                            {activeCall?.peerName || incomingCall?.callerName}
                        </h3>
                        <p className="text-gray-300 font-mono text-xl mb-8 tracking-wider">{formatDuration(callDuration)}</p>

                        <div className="flex gap-6">
                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-colors shadow-lg ${isMuted ? 'bg-white text-gray-800' : 'bg-[#2a3942] text-white hover:bg-[#374248]'}`}
                            >
                                {isMuted ? <IoMicOff size={24} /> : <IoMic size={24} />}
                            </button>
                            <button onClick={handleEndCall} className="bg-red-500 p-4 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <IoCall className="text-white text-2xl transform rotate-[135deg]" />
                            </button>
                            <button className="bg-[#2a3942] p-4 rounded-full hover:bg-[#374248] transition-colors shadow-lg text-white">
                                <IoPersonAdd size={24} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VoiceCall;
