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

    async setAuth(socketToken) {
        await this.supabase.realtime.setAuth(socketToken);
    }

    subscribe(roomName, eventName, callback, config = {}) {
        if (this.channels.has(roomName)) {
            return;
        }

        const channel = this.supabase.channel(roomName, {
            config,
        });

        channel
            .on("broadcast", { event: eventName }, callback)
            .subscribe();

        this.channels.set(roomName, channel);
    }

    async removeChannel(roomName) {
        const channel = this.channels.get(roomName);

        if (!channel) {
            return;
        }

        await this.supabase.removeChannel(channel);
        this.channels.delete(roomName);
    }

    async disconnect() {
        for (const channel of this.channels.values()) {
            await this.supabase.removeChannel(channel);
        }

        this.channels.clear();
    }
}

export const socketClient = new SocketClient();