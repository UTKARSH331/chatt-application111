import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
    name: "call",
    initialState: {
        incomingCall: null,   // { from, callerName, callerPhoto, offer }
        activeCall: null,     // { peerId, peerName, roomId? }
        callStatus: "idle",   // idle | ringing | active | ended
        callHistory: [],      // Local history for now
    },
    reducers: {
        setIncomingCall: (state, action) => {
            state.incomingCall = action.payload;
            state.callStatus = "ringing";
        },
        setActiveCall: (state, action) => {
            state.activeCall = action.payload;
            state.callStatus = "active";
            state.incomingCall = null;
        },
        endCall: (state) => {
            state.incomingCall = null;
            state.activeCall = null;
            state.callStatus = "idle";
        },
        setCallStatus: (state, action) => {
            state.callStatus = action.payload;
        },
        addToCallHistory: (state, action) => {
            if (!state.callHistory) {
                state.callHistory = [];
            }
            state.callHistory.unshift(action.payload);
        }
    }
});

export const { setIncomingCall, setActiveCall, endCall, setCallStatus, addToCallHistory } = callSlice.actions;
export default callSlice.reducer;
