import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        notifications: [],
        unreadCounts: {}, // { userId: count }
    },
    reducers: {
        addNotification: (state, action) => {
            if (!state.notifications) state.notifications = [];
            if (!state.unreadCounts) state.unreadCounts = {};
            state.notifications.push(action.payload);
            const fromId = action.payload.fromUserId;
            state.unreadCounts[fromId] = (state.unreadCounts[fromId] || 0) + 1;
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
            // Recalculate unread counts
            const counts = {};
            action.payload.forEach(n => {
                const fromId = n.fromUserId?._id || n.fromUserId;
                counts[fromId] = (counts[fromId] || 0) + 1;
            });
            state.unreadCounts = counts;
        },
        clearNotificationsForUser: (state, action) => {
            if (!state.notifications) state.notifications = [];
            if (!state.unreadCounts) state.unreadCounts = {};
            const userId = action.payload;
            state.notifications = state.notifications.filter(
                n => (n.fromUserId?._id || n.fromUserId) !== userId
            );
            delete state.unreadCounts[userId];
        },
    }
});

export const { addNotification, setNotifications, clearNotificationsForUser } = notificationSlice.actions;
export default notificationSlice.reducer;
