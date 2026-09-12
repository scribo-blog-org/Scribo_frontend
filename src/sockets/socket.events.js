import { socketClient } from "./socket.client";

class SocketEvents {
    subscribeUserNotifications(userId, callback) {
        const roomName = `user:${userId}`;

        socketClient.subscribe(
            roomName,
            "notification",
            (message) => {
                const notifications =
                    message.payload?.notifications;

                if (!notifications) {
                    return;
                }

                callback(notifications);
            },
            {
                private: true,
            }
        );
    }
}

export const socketEvents = new SocketEvents();