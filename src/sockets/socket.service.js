import { socketClient } from "./socket.client";
import { socketEvents } from "./socket.events";

class SocketService {
    constructor() {
        this.isConnected = false;
        this.currentUser = null;
    }

    async init(user, socketToken) {
        if (!user?._id || !socketToken) {
            console.warn(
                "[SocketService] Недостатньо даних для підключення"
            );
            return;
        }

        if (
            this.isConnected &&
            this.currentUser?._id === user._id
        ) {
            return;
        }

        this.currentUser = user;

        await socketClient.setAuth(socketToken);

        socketEvents.subscribeUserNotifications(
            user._id,
            (notifications) => {
                this.emit("notification", notifications);
            }
        );

        socketEvents.subscribeChatUnread(user._id, (unread) => {
            this.emit("chat:unread", unread);
        });

        socketEvents.subscribeChatConversation(user._id, (conversation) => {
            this.emit("chat:conversation", conversation);
        });

        socketEvents.subscribeChatConversationDeleted(user._id, (conversationId) => {
            this.emit("chat:conversation-deleted", conversationId);
        });

        this.isConnected = true;
    }

    async disconnect() {
        await socketClient.disconnect();

        this.isConnected = false;
        this.currentUser = null;
    }

    on(eventName, callback) {
        const event = `socket:${eventName}`;

        const handler = (event) => {
            callback(event.detail);
        };

        window.addEventListener(event, handler);

        return () => {
            window.removeEventListener(event, handler);
        };
    }

    emit(eventName, payload) {
        window.dispatchEvent(
            new CustomEvent(`socket:${eventName}`, {
                detail: payload,
            })
        );
    }
}

export const socketService = new SocketService();