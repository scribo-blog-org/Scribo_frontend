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

        // roomName -> { channel, status }
        this.channels = new Map();
        // roomName -> Promise, in-flight subscribe() creation (dedupe concurrent subscribe calls)
        this.pendingChannels = new Map();
        // roomName -> Promise, in-flight removeChannel() call (must finish before recreating)
        this.pendingRemovals = new Map();

        this.lastToken = null;
        this.authReady = null;
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
        this.lastToken = socketToken;
        this.authReady = this.supabase.realtime.setAuth(socketToken);
        await this.authReady;
        this.logAuth(socketToken);
    }

    async _createChannel(roomName, config) {
        // Гарантируем, что JWT реально применён перед созданием НОВОГО приватного канала -
        // Realtime может открыть отдельное backend-соединение под авторизацию каждого
        // приватного канала, и предыдущего единственного setAuth() может не хватить,
        // если он не успел "долететь" до этого нового соединения.
        if (config.private) {
            if (this.authReady) {
                await this.authReady;
            }
            if (this.lastToken) {
                await this.supabase.realtime.setAuth(this.lastToken);
            }
        }

        console.log("[Socket] connecting", {
            room: roomName,
            private: config.private ?? false,
        });

        const channel = this.supabase.channel(roomName, { config });
        const entry = { channel, status: "PENDING" };
        this.channels.set(roomName, entry);

        channel.subscribe((status, err) => {
            entry.status = status;

            if (status === "SUBSCRIBED") {
                console.log("[Socket] subscribed", { room: roomName });
                return;
            }

            if (status === "CHANNEL_ERROR") {
                console.error("[Socket] channel error", { room: roomName, err });
                return;
            }

            if (status === "TIMED_OUT") {
                console.warn("[Socket] subscribe timeout", { room: roomName });
                return;
            }

            console.log("[Socket] channel status", { room: roomName, status, err });
        });

        return entry;
    }

    async subscribe(roomName, eventName, callback, config = {}) {
        // Если для этой комнаты сейчас выполняется removeChannel() - обязательно ждём его
        // завершения, иначе можем создать новый канал с тем же topic-именем, пока старый
        // физически ещё не удалён на уровне WebSocket (сервер будет путать подписки).
        const pendingRemoval = this.pendingRemovals.get(roomName);
        if (pendingRemoval) {
            await pendingRemoval;
        }

        const attach = (channel) => {
            channel.on("broadcast", { event: eventName }, (message) => {
                console.log("[Socket] broadcast received", {
                    room: roomName,
                    event: eventName,
                    payload: message?.payload,
                });
                callback(message);
            });
        };

        const existing = this.channels.get(roomName);
        if (existing && !DEAD_STATUSES.has(existing.status)) {
            attach(existing.channel);
            return;
        }

        if (existing && DEAD_STATUSES.has(existing.status)) {
            // Канал мёртв (CLOSED/CHANNEL_ERROR/TIMED_OUT), но остался в map -
            // выкидываем его и создаём заново, иначе listener навсегда подвешен в пустоту.
            console.warn("[Socket] found dead channel, recreating", {
                room: roomName,
                status: existing.status,
            });
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

        console.log("[Socket] unsubscribing", { room: roomName });
        this.channels.delete(roomName);

        const removalPromise = this.supabase
            .removeChannel(entry.channel)
            .then(() => {
                console.log("[Socket] unsubscribed", { room: roomName });
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