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

  subscribeChatConversationDeleted(userId, callback) {
    const roomName = `user:${userId}`;

    socketClient.subscribe(
      roomName,
      "chat:conversation-deleted",
      (message) => {
        if (!message.payload?.conversation_id) {
          return;
        }
        callback(message.payload.conversation_id);
      },
      { private: true },
    );
  }

  chatRoom(conversationId) {
    return `chat:${conversationId}`;
  }

  subscribeConversation(userId, conversationId, handlers) {
    const roomName = this.chatRoom(conversationId);

    if (handlers.onMessage) {
      socketClient.subscribe(
        roomName,
        "chat:message",
        (message) => {
          if (!message.payload?.message) {
            return;
          }
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
          handlers.onRead(message.payload);
        },
        { private: true },
      );
    }
  }

  unsubscribeConversation(userId, conversationId) {
    const roomName = this.chatRoom(conversationId);
    return socketClient.removeChannel(roomName);
  }
}

export const socketEvents = new SocketEvents();