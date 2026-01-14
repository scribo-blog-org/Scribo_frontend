import { API_URL } from "../config"


export const getUsers = async (query) => {
    if (query.length === 0) {
        return [];
    }

    const uniqueIds = [...new Set(query.map(item => item._id))];

    const queryString = uniqueIds.map(id => `_id=${id}`).join("&");

    try {
        const response = await fetch(`${API_URL}/api/users/?${queryString}`);
        const result = await response.json();

        if (!Array.isArray(result?.data)) {
            console.error("Unexpected response format:", result);
            return [];
        }

        const userMap = new Map(result.data.map(user => [user._id, user]));
        return {
            status: true,
            data: query.map(item => userMap.get(item._id) || null)
        }
    } catch (err) {
        console.error(err);
        return query.map(() => ({
            status: false,
            message: err,
            data: null
        }));
    }
};

export const read_notifications = async () => {
    const formData = new FormData();
    formData.append("token", localStorage.getItem("token"));
    
    const result = await fetch(`${API_URL}/api/profile/read-notifications`, { method: "POST", body: formData})
    return await result.json();
}