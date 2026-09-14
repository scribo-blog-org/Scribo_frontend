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

        console.log("[SocketService] init", { userId: user._id });
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

        this.isConnected = true;
        console.log("[SocketService] ready", { userId: user._id });
    }

    async disconnect() {
        console.log("[SocketService] disconnect");
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