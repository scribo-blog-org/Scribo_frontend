import { API_URL } from "../config"
import { apiFetch } from "./http"


const getUsers = async (query = []) => {

    const params = new URLSearchParams();

    query.forEach(item => {
        Object.entries(item).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
    });

    try {
        const response = await apiFetch(`${API_URL}/api/users/?${params.toString()}`);
        const result = await response.json();

        return result;
    } catch (err) {
        console.error(err);

        return {
            status: false,
            message: err.message
        };
    }
};

const updateRole = async (user_id, new_role) => {
    try {
        const response = await apiFetch(`${API_URL}/api/users/${user_id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userRole: new_role })
        });
        const result = await response.json();
        return result;
    } catch (err) {
        console.error(err);
        return {
            status: false,
            message: err.message
        };
    }
}

const read_notifications = async () => {
    const result = await apiFetch(`${API_URL}/api/profile/notifications`, { method: "PATCH" })
    return await result.json();
}

const follow = async ({method="POST", user_id}) => {
    try {
        const response = await apiFetch(`${API_URL}/api/users/${user_id}/follow`, { method: method })

        const status = response.status;
        const result = await response.json();

        return {
            statusCode: status,
            ...result
        };
    }
    catch(e) {
        console.log(e)
    }
}

const getUsersByIds = async (ids = []) => {
    const unique = [...new Set((ids || []).map(String).filter(Boolean))];
    if (!unique.length) {
        return [];
    }

    const result = await getUsers([{ _id: unique.join(",") }]);
    return result?.status && Array.isArray(result.data) ? result.data : [];
};

export {
    getUsers,
    getUsersByIds,
    updateRole,
    read_notifications,
    follow
}
