import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    },
);

const userActivityRoom = (userId) => `useractivity:${userId}`;

const userActivitySubscriptions = new Map();
let presenceChangesSubscription = null;

const notifyListeners = (listeners, value) => {
    for (const listener of listeners) {
        listener(value);
    }
};

const isUserOnline = async (userId) => {
    const { count, error } = await supabase
        .from("user_presence")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) {
        return false;
    }

    return (count ?? 0) > 0;
};

const refreshUserActivity = async (userId, listeners) => {
    const online = await isUserOnline(userId);
    notifyListeners(listeners, online);
};

const subscribeUserActivity = (userId, onChange) => {
    let entry = userActivitySubscriptions.get(userId);

    if (!entry) {
        const listeners = new Set();
        const roomName = userActivityRoom(userId);

        const channel = supabase
            .channel(roomName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_presence",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    void refreshUserActivity(userId, listeners);
                },
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    void refreshUserActivity(userId, listeners);
                }
            });

        entry = { channel, listeners };
        userActivitySubscriptions.set(userId, entry);
    }

    entry.listeners.add(onChange);
    void isUserOnline(userId).then(onChange);

    return async () => {
        entry.listeners.delete(onChange);

        if (entry.listeners.size === 0) {
            userActivitySubscriptions.delete(userId);
            await supabase.removeChannel(entry.channel);
        }
    };
};

const subscribePresenceChanges = (onUserChange) => {
    if (!presenceChangesSubscription) {
        const listeners = new Set();

        const channel = supabase
            .channel("presence-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_presence",
                },
                (payload) => {
                    const userId = payload.new?.user_id || payload.old?.user_id;
                    if (!userId) {
                        return;
                    }

                    void isUserOnline(userId).then((online) => {
                        for (const listener of listeners) {
                            listener(String(userId), online);
                        }
                    });
                },
            )
            .subscribe();

        presenceChangesSubscription = { channel, listeners };
    }

    presenceChangesSubscription.listeners.add(onUserChange);

    return async () => {
        presenceChangesSubscription.listeners.delete(onUserChange);

        if (presenceChangesSubscription.listeners.size === 0) {
            await supabase.removeChannel(presenceChangesSubscription.channel);
            presenceChangesSubscription = null;
        }
    };
};

const loadOnlineStatusForUsers = async (userIds) => {
    const entries = await Promise.all(
        userIds.map(async (userId) => [userId, await isUserOnline(userId)]),
    );

    return Object.fromEntries(entries);
};

export {
    isUserOnline,
    loadOnlineStatusForUsers,
    subscribePresenceChanges,
    subscribeUserActivity,
    userActivityRoom,
};
