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
                accessToken: async () => this.lastToken,
            },
        );

        this.channels = new Map();
        this.pendingChannels = new Map();
        this.pendingRemovals = new Map();
        this.statusListeners = new Map();

        this.lastToken = null;
        this.authReady = null;
    }

    async setAuth(socketToken) {
        this.lastToken = socketToken;
        this.authReady = this.supabase.realtime.setAuth(socketToken);
        await this.authReady;
    }

    onChannelStatus(roomName, callback) {
        const listeners = this.statusListeners.get(roomName) || new Set();
        listeners.add(callback);
        this.statusListeners.set(roomName, listeners);

        const entry = this.channels.get(roomName);
        if (entry?.status === "SUBSCRIBED") {
            callback("SUBSCRIBED");
        }

        return () => {
            const current = this.statusListeners.get(roomName);
            if (!current) {
                return;
            }
            current.delete(callback);
            if (current.size === 0) {
                this.statusListeners.delete(roomName);
            }
        };
    }

    waitForSubscribed(roomName) {
        const entry = this.channels.get(roomName);
        if (entry?.status === "SUBSCRIBED") {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const unsubscribe = this.onChannelStatus(roomName, (status) => {
                if (status === "SUBSCRIBED") {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }

    _emitChannelStatus(roomName, status) {
        const listeners = this.statusListeners.get(roomName);
        if (!listeners) {
            return;
        }

        for (const listener of listeners) {
            listener(status);
        }
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
            this._emitChannelStatus(roomName, status);

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
        this.statusListeners.delete(roomName);

        const removalPromise = this.supabase
            .removeChannel(entry.channel)
            .then(() => {
                this._emitChannelStatus(roomName, "CLOSED");
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
        this.statusListeners.clear();
    }

    async upsertPresence(userId, connectionId) {
        if (!userId || !connectionId) {
            return;
        }

        if (this.authReady) {
            await this.authReady;
        }

        await this.supabase.from("user_presence").upsert({
            user_id: String(userId),
            connection_id: connectionId,
            connected_at: new Date().toISOString(),
        });
    }

    async removePresence(userId, connectionId) {
        if (!userId || !connectionId) {
            return;
        }

        if (this.authReady) {
            await this.authReady;
        }

        await this.supabase
            .from("user_presence")
            .delete()
            .eq("user_id", String(userId))
            .eq("connection_id", connectionId);
    }

    removePresenceKeepalive(userId, connectionId) {
        const token = this.lastToken;
        if (!userId || !connectionId || !token) {
            return;
        }

        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const params = new URLSearchParams({
            user_id: `eq.${String(userId)}`,
            connection_id: `eq.${connectionId}`,
        });

        try {
            void fetch(`${baseUrl}/rest/v1/user_presence?${params}`, {
                method: "DELETE",
                headers: {
                    apikey: anonKey,
                    Authorization: `Bearer ${token}`,
                },
                keepalive: true,
            });
        } catch {
            void this.removePresence(userId, connectionId);
        }
    }
}

export const socketClient = new SocketClient();
