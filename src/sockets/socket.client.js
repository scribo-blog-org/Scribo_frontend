import { createClient } from "@supabase/supabase-js";

const DEAD_STATUSES = new Set(["CLOSED", "CHANNEL_ERROR", "TIMED_OUT"]);

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
        this.pendingChannels = new Map();
        this.pendingRemovals = new Map();

        this.lastToken = null;
        this.authReady = null;
    }

    async setAuth(socketToken) {
        this.lastToken = socketToken;
        this.authReady = this.supabase.realtime.setAuth(socketToken);
        await this.authReady;
    }

    async _createChannel(roomName, config) {
        if (config.private) {
            if (this.authReady) {
                await this.authReady;
            }
            if (this.lastToken) {
                await this.supabase.realtime.setAuth(this.lastToken);
            }
        }

        const channel = this.supabase.channel(roomName, { config });
        const entry = { channel, status: "PENDING" };
        this.channels.set(roomName, entry);

        channel.subscribe((status) => {
            entry.status = status;

            if (status === "SUBSCRIBED") {
                return;
            }

            if (status === "CHANNEL_ERROR") {
                return;
            }

            if (status === "TIMED_OUT") {
                return;
            }
        });

        return entry;
    }

    async subscribe(roomName, eventName, callback, config = {}) {
        const pendingRemoval = this.pendingRemovals.get(roomName);
        if (pendingRemoval) {
            await pendingRemoval;
        }

        const attach = (channel) => {
            channel.on("broadcast", { event: eventName }, (message) => {
                callback(message);
            });
        };

        const existing = this.channels.get(roomName);
        if (existing && !DEAD_STATUSES.has(existing.status)) {
            attach(existing.channel);
            return;
        }

        if (existing && DEAD_STATUSES.has(existing.status)) {
            this.channels.delete(roomName);
        }

        const pending = this.pendingChannels.get(roomName);
        if (pending) {
            const entry = await pending;
            attach(entry.channel);
            return;
        }

        const createPromise = this._createChannel(roomName, config).finally(() => {
            this.pendingChannels.delete(roomName);
        });
        this.pendingChannels.set(roomName, createPromise);

        const entry = await createPromise;
        attach(entry.channel);
    }

    async removeChannel(roomName) {
        const entry = this.channels.get(roomName);

        if (!entry) {
            return;
        }

        this.channels.delete(roomName);

        const removalPromise = this.supabase
            .removeChannel(entry.channel)
            .then(() => {
            })
            .finally(() => {
                this.pendingRemovals.delete(roomName);
            });

        this.pendingRemovals.set(roomName, removalPromise);
        await removalPromise;
    }

    async disconnect() {
        const rooms = [...this.channels.keys()];
        await Promise.all(rooms.map((roomName) => this.removeChannel(roomName)));
        this.channels.clear();
        this.pendingChannels.clear();
        this.pendingRemovals.clear();
    }
}

export const socketClient = new SocketClient();