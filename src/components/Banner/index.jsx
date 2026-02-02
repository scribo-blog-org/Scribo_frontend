import "./Banner.scss";
import { ReactComponent as Logo } from "../../assets/svg/full-logo-text-icon.svg";
import { Link } from 'react-router-dom';
import ChipButton from "../Ui/ChipButton";



const Banner = () => {
    
    const redirect_to_personal_github = () => {
        window.open("https://github.com/MaksimKosyanchuk", "_blank");
    }
    
    return (
        <div className="banner">
            <div className="banner_content">
                <div className="banner_content_title">
                    <h1>
                        Hello! It's{" "}
                    </h1>
                    <Logo className="banner_content_title_logo app-transition"/>
                </div>

                <p className="banner_content_text">
                    This is my personal project, developed voluntarily in my free time.
    I’d really appreciate it if you checked out the links below.
                </p>

                <div className="banner_content_actions">
                    <ChipButton is_active={true} onClick={redirect_to_personal_github}>
                        My GitHub
                    </ChipButton>
                    <ChipButton is_active={true}>
                        <Link to={"/users/Maks"}>
                            My profile
                        </Link>
                    </ChipButton>
                </div>
            </div>

            <img
                src="/static/media/banner-img.893505d459742f6e2c72.png"
                alt=""
                className="banner_image"
            />
        </div>
    );
};

export default Banner;
