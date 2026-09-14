import { socketClient } from "./socket.client";

class SocketEvents {
  subscribeUserNotifications(userId, callback) {
    const roomName = `user:${userId}`;

    socketClient.subscribe(
      roomName,
      "notification",
      (message) => {
        const notifications = message.payload?.notifications;
        if (!notifications) {
          return;
        }
        callback(notifications);
      },
      { private: true },
    );
  }

  subscribeChatUnread(userId, callback) {
    const roomName = `user:${userId}`;

    socketClient.subscribe(
      roomName,
      "chat:unread",
      (message) => {
        if (typeof message.payload?.unread !== "number") {
          return;
        }
        callback(message.payload.unread);
      },
      { private: true },
    );
  }

  subscribeChatConversation(userId, callback) {
    const roomName = `user:${userId}`;

    socketClient.subscribe(
      roomName,
      "chat:conversation",
      (message) => {
        if (!message.payload?.conversation) {
          return;
        }
        callback(message.payload.conversation);
      },
      { private: true },
    );
  }

  chatRoom(conversationId) {
    return `chat:${conversationId}`;
  }

  subscribeConversation(userId, conversationId, handlers) {
    const roomName = this.chatRoom(conversationId);

    console.log("[ChatRealtime] subscribe conversation", {
      userId,
      conversationId,
      room: roomName,
      events: [
        handlers.onMessage ? "chat:message" : null,
        handlers.onRead ? "chat:read" : null,
      ].filter(Boolean),
    });

    if (handlers.onMessage) {
      socketClient.subscribe(
        roomName,
        "chat:message",
        (message) => {
          if (!message.payload?.message) {
            console.warn("[ChatRealtime] empty message payload", {
              conversationId,
              message,
            });
            return;
          }

          console.log("[ChatRealtime] message", {
            conversationId,
            messageId: message.payload.message._id,
            senderId: message.payload.message.sender?._id,
            text: message.payload.message.text,
          });
          handlers.onMessage(message.payload.message);
        },
        { private: true },
      );
    }

    if (handlers.onRead) {
      socketClient.subscribe(
        roomName,
        "chat:read",
        (message) => {
          console.log("[ChatRealtime] read", {
            conversationId,
            payload: message.payload,
          });
          handlers.onRead(message.payload);
        },
        { private: true },
      );
    }
  }

  unsubscribeConversation(userId, conversationId) {
    const roomName = this.chatRoom(conversationId);
    console.log("[ChatRealtime] unsubscribe conversation", {
      userId,
      conversationId,
      room: roomName,
    });
    return socketClient.removeChannel(roomName);
  }
}

export const socketEvents = new SocketEvents();