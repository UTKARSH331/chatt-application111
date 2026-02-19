import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        authUser: null,
        otherUsers: null,
        selectedUser: null,
        onlineUsers: null,
        availableAccounts: []
    },
    reducers: {
        setAuthUser: (state, action) => {
            state.authUser = action.payload;
            if (!state.availableAccounts) {
                state.availableAccounts = [];
            }
            if (action.payload) {
                const exists = state.availableAccounts.find(acc => acc._id === action.payload._id);
                if (!exists) {
                    state.availableAccounts.push({
                        _id: action.payload._id,
                        fullName: action.payload.fullName,
                        profilePhoto: action.payload.profilePhoto,
                        username: action.payload.username
                    });
                } else {
                    // Update existing
                    const index = state.availableAccounts.findIndex(acc => acc._id === action.payload._id);
                    if (index !== -1) {
                        state.availableAccounts[index] = {
                            ...state.availableAccounts[index],
                            ...action.payload
                        };
                    }
                }
            }
        },
        setOtherUsers: (state, action) => {
            state.otherUsers = action.payload;
        },
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload;
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },
        logoutAccount: (state) => {
            state.authUser = null;
            state.selectedUser = null;
            state.otherUsers = null;
            // Do NOT clear availableAccounts on logout, so we can switch back
        }
    }
});

export const { setAuthUser, setOtherUsers, setSelectedUser, setOnlineUsers, logoutAccount } = userSlice.actions;
export default userSlice.reducer;