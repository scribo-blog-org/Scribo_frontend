import "./Banner.scss";
import { ReactComponent as Logo } from "../../assets/svg/full-logo-text-icon.svg";
import { Link } from 'react-router-dom';


const Banner = () => {
    return (
        <div className="banner">
            <div className="banner__content">
                <div className="banner__title">
                    <h1>
                    Hello! It's{" "}
                    </h1>
                    <Logo className="banner__logo app-transition"/>
                </div>

                <p className="banner__text">
                    This is my personal project, developed voluntarily in my free time.
    I’d really appreciate it if you checked out the links below.
                </p>

                <div className="banner__actions">
                    <a
                        href="https://github.com/MaksimKosyanchuk"
                        target="_blank"
                        rel="noreferrer"
                        className="banner__btn banner__btn--primary app-transition"
                    >
                        My GitHub
                    </a>

                    <Link
                        to={"/users/Maks"}
                        className="banner__btn banner__btn--secondary app-transition"
                    >
                        My profile
                    </Link>
                </div>
            </div>

            <img
                src="/static/media/banner-img.893505d459742f6e2c72.png"
                alt=""
                className="banner__image"
            />
        </div>
    );
};

export default Banner;
