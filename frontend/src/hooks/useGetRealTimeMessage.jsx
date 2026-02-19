import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMessages } from "../redux/messageSlice";

const useGetRealTimeMessage = () => {
    const { socket } = useSelector(store => store.socket);
    const { messages } = useSelector(store => store.message);
    const { selectedUser, authUser } = useSelector(store => store.user);
    const dispatch = useDispatch();

    useEffect(() => {
        socket?.on("newMessage", (newMessage) => {
            // Logic to determine if this message belongs in the current chat view:
            // 1. It's from the selected user to me.
            // 2. I sent it in another tab to the selected user.
            const isFromSelectedUser = selectedUser?._id === newMessage.senderId;
            const isSyncFromMe = authUser?._id === newMessage.senderId && selectedUser?._id === newMessage.receiverId;

            if (isFromSelectedUser || isSyncFromMe) {
                // Prevent duplicates (e.g., if we just sent this message in this very tab and it was added via the API response)
                const isDuplicate = messages?.some(msg => msg._id === newMessage._id);
                if (!isDuplicate) {
                    dispatch(setMessages(messages ? [...messages, newMessage] : [newMessage]));
                }
            }
        });
        return () => socket?.off("newMessage");
    }, [messages, selectedUser, authUser, socket, dispatch]);
};
export default useGetRealTimeMessage;