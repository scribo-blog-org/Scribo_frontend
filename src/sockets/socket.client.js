import { createClient } from "@supabase/supabase-js";

class SocketClient {
    constructor() {
        this.supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            }
        );

        this.channels = new Map();
    }

    logAuth(socketToken) {
        try {
            const payload = JSON.parse(atob(socketToken.split(".")[1]));
            console.log("[Socket] auth set (socketToken, not accessToken)", {
                sub: payload.sub,
                id: payload.id,
                role: payload.role,
                aud: payload.aud,
                exp: payload.exp,
            });
        } catch {
            console.log("[Socket] auth set");
        }
    }

    async setAuth(socketToken) {
        await this.supabase.realtime.setAuth(socketToken);
        this.logAuth(socketToken);
    }

    subscribe(roomName, eventName, callback, config = {}) {
        let channel = this.channels.get(roomName);

        if (!channel) {
            console.log("[Socket] connecting", {
                room: roomName,
                private: config.private ?? false,
            });

            channel = this.supabase.channel(roomName, { config });
            channel.subscribe((status, err) => {
                if (status === "SUBSCRIBED") {
                    console.log("[Socket] subscribed", { room: roomName });
                    return;
                }

                if (status === "CHANNEL_ERROR") {
                    console.error("[Socket] channel error", {
                        room: roomName,
                        err,
                    });
                    return;
                }

                if (status === "TIMED_OUT") {
                    console.warn("[Socket] subscribe timeout", {
                        room: roomName,
                    });
                    return;
                }

                console.log("[Socket] channel status", {
                    room: roomName,
                    status,
                    err,
                });
            });
            this.channels.set(roomName, channel);
        }

        channel.on("broadcast", { event: eventName }, (message) => {
            console.log("[Socket] broadcast received", {
                room: roomName,
                event: eventName,
                payload: message?.payload,
            });
            callback(message);
        });
    }

    async removeChannel(roomName) {
        const channel = this.channels.get(roomName);

        if (!channel) {
            return;
        }

        console.log("[Socket] unsubscribing", { room: roomName });
        await this.supabase.removeChannel(channel);
        this.channels.delete(roomName);
        console.log("[Socket] unsubscribed", { room: roomName });
    }

    async disconnect() {
        for (const channel of this.channels.values()) {
            await this.supabase.removeChannel(channel);
        }

        this.channels.clear();
    }
}

export const socketClient = new SocketClient();
