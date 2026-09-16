import { socketClient } from "./socket.client";
import { socketEvents } from "./socket.events";

class SocketService {
    constructor() {
        this.isConnected = false;
        this.currentUser = null;
        this.connectionId = null;
        this.presenceUnsubscribe = null;
        this.beforeUnloadHandler = null;
    }

    _userRoom(userId) {
        return socketEvents.userRoom(userId);
    }

    _createConnectionId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    _bindPresence() {
        this._unbindPresence();

        const userId = this.currentUser._id;
        const roomName = this._userRoom(userId);
        let presenceRegistered = false;

        const notifyConnect = async () => {
            if (presenceRegistered) {
                return;
            }
            presenceRegistered = true;
            await socketClient.upsertPresence(userId, this.connectionId);
        };

        const notifyDisconnect = async () => {
            if (!presenceRegistered) {
                return;
            }
            presenceRegistered = false;
            await socketClient.removePresence(userId, this.connectionId);
        };

        this.presenceUnsubscribe = socketClient.onChannelStatus(
            roomName,
            (status) => {
                if (status === "SUBSCRIBED") {
                    void notifyConnect();
                    return;
                }

                if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    void notifyDisconnect();
                }
            },
        );

        this.beforeUnloadHandler = () => {
            socketClient.removePresenceKeepalive(userId, this.connectionId);
        };
        window.addEventListener("pagehide", this.beforeUnloadHandler);
    }

    _unbindPresence() {
        if (this.presenceUnsubscribe) {
            this.presenceUnsubscribe();
            this.presenceUnsubscribe = null;
        }

        if (this.beforeUnloadHandler) {
            window.removeEventListener("pagehide", this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
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

        if (this.isConnected) {
            await this.disconnect();
        }

        this.currentUser = user;
        this.connectionId = this._createConnectionId();

        await socketClient.setAuth(socketToken);
        this._bindPresence();

        await socketEvents.subscribeUserNotifications(
            user._id,
            (notifications) => {
                this.emit("notification", notifications);
            }
        );

        void socketEvents.subscribeChatUnread(user._id, (unread) => {
            this.emit("chat:unread", unread);
        });

        void socketEvents.subscribeChatConversation(user._id, (conversation) => {
            this.emit("chat:conversation", conversation);
        });

        void socketEvents.subscribeChatConversationDeleted(user._id, (conversationId) => {
            this.emit("chat:conversation-deleted", conversationId);
        });

        await socketClient.waitForSubscribed(this._userRoom(user._id));

        this.isConnected = true;
    }

    async disconnect() {
        const userId = this.currentUser?._id;

        if (userId && this.connectionId) {
            await socketClient.removePresence(userId, this.connectionId);
        }

        this._unbindPresence();
        await socketClient.disconnect();

        this.isConnected = false;
        this.currentUser = null;
        this.connectionId = null;
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
