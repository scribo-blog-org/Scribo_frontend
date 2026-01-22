import { AppContext } from "../../App.js";
import { useContext } from "react";
import { API_URL } from "../../config";
import "./FollowButton.scss";

const FollowButton = ({ setNewData, author_id, class_name }) => {
    const { profile, showToast } = useContext(AppContext);

    const follow = async () => {
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
            const follow = await fetch(`${API_URL}/api/users/${author_id}/follow`, { method: "POST",  headers: headers })
            const result = await follow.json();

            if(result.status === true) {
                await setNewData(result.data)
                showToast({ message: `Вы подписались на ${result.data.followed.nick_name}!`, type: "success" })
            }
            else {
                if(result?.errors?.Authorization?.token){
                    showToast({ type: "warning", message: "Чтобы подписаться нужно войти в аккаунт!" })
                }
            }
        }
        catch(e) {
            console.log(e)
        }
    }

    const unfollow = async () => {
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
            const follow = await fetch(`${API_URL}/api/users/${author_id}/follow`, { method: "DELETE",  headers: headers })
            const result = await follow.json();

            if(result.status === true) {
                await setNewData(result.data)
                showToast({ message: `Вы отписались от ${result.data.followed.nick_name}!`, type: "success" })
            }
            else {
                if(result?.errors?.token){
                    showToast({ type: "warning", message: "Чтобы подписаться нужно войти в аккаунт!" })
                }
                else if(result?.errors?.nick_name) {
                    showToast({ type: "warning", message: result?.errors?.nick_name?.message })   
                }
            }
        }
        catch(e) {
            console.log(e)
        }
    }

    return (
        profile?.follows?.some(item => item === author_id) ?
            <button
                onClick={() => unfollow(author_id) }
                className={ `follow_button app-transition ${class_name ?? "" } ${ (profile?._id === author_id) ? "non_visible" : "d" }` }
            >
                Отписаться
            </button>
        :
            <button
                onClick={ () => { follow(author_id) } }
                className={ `follow_button app-transition ${class_name ?? "" } ${profile?._id === author_id ? "non_visible" : "d" }` }
            >
                Подписаться
            </button>
    )
}

export default FollowButton;