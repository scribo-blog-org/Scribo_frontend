import { useContext, useEffect } from "react";
import { AppContext } from "../../App";
import { API_URL } from "../../config";
import { useLocation, useNavigate } from "react-router-dom";
import "./StartScreen.scss"

const StartScreen = ({ children }) => {
    const location = useLocation()
    const { setProfile, setProfileLoading } = useContext(AppContext) 
    const { profile } = useContext(AppContext)
    const navigate = useNavigate()

    const getProfile = async () => {
        setProfileLoading(true)
        const token = localStorage.getItem('token');
        
        if (token) {
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            };
            
            try {
                const response = await fetch(`${API_URL}/api/profile`, requestOptions);
                const profileData = await response.json();
                if (profileData.status === true) {
                    setProfile(profileData.data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setProfile(null)
            }
            finally{
                setProfileLoading(false)
            }
        }
        else{
            setProfile(null)
            setProfileLoading(false)
        }
    };

    useEffect(() => {
        getProfile();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);


    const handleClick = () => {
        navigate("/create-post")
    }

    return (
        <div className="start_screen app-transition">
            <div className="container">
                <div className="main_div">
                    {children}
                </div>
            </div>
            {
                (profile && profile.is_admin && location?.pathname !== "/create-post") ? 
                <div className={"create_post_button"}>
                    <button className={"submit_button blurred app-transition"} onClick={handleClick}>Создать новость</button> 
                </div>
                : <></>
            }
        </div>
    );
}

export default StartScreen;
