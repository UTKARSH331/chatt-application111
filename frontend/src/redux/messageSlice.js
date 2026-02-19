import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],
    },
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        updateMessageParams: (state, action) => {
            const { messageId, deletedForEveryone } = action.payload;
            const msg = state.messages.find(m => m._id === messageId);
            if (msg) {
                if (deletedForEveryone) {
                    msg.deletedForEveryone = true;
                    msg.message = "This message was deleted";
                }
            }
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter(m => m._id !== action.payload);
        }
    }
});

export const { setMessages, addMessage, updateMessageParams, removeMessage } = messageSlice.actions;
export default messageSlice.reducer;