import "./Footer.scss"
import { Link } from 'react-router-dom';
import LinkToProfile from '../LinkToProfile';
import { ReactComponent as GhIcon } from "../../assets/svg/github-icon.svg";
import { ReactComponent as InstagramIcon } from "../../assets/svg/instagram-icon.svg";
import { ReactComponent as TelegramIcon } from "../../assets/svg/telegram-icon.svg";
import { ReactComponent as TWitterIcon } from "../../assets/svg/twitter-icon.svg";
import { ReactComponent as MainLogo } from "../../assets/svg/full-logo-icon.svg";

function Footer(){
    return(
        <footer className="blurred app-transition">
            <div className="container">
                <div className="footer_top_content">
                    <div className="footer_links">
                        <Link to={'/posts'}><p>Домой</p></Link>
                    </div>
                    <div className="footer_links">
                        <LinkToProfile to={'/profile'}><p>Профиль</p></LinkToProfile>
                    </div>
                    <div className="footer_links">
                        <a href="https://github.com/MaksimKosyanchuk/news_site_backend/blob/master/README.md#fetches" target="_blank" rel="noreferrer"><p>Api</p></a>
                    </div>
                    <div className="footer_links">
                        <Link to={'/users/Dev'}><p>Dev blog</p></Link>
                    </div>
                    <div className="footer_links">
                        <a href="https://github.com/MaksimKosyanchuk" target="_blank" rel="noreferrer"><p>GitHub</p></a>
                    </div>
                </div>
                <div className="footer_bottom_content app-transition">
                    <div className="footer_column footer_socials">
                        <a className="footer_socials_item" href="https://github.com/MaksimKosyanchuk" target="_blank" rel="noreferrer">
                            <GhIcon className="app-transition"/>
                        </a>
                        <a className="footer_socials_item" href="https://www.instagram.com/maks_kos/" target="_blank" rel="noreferrer">
                            <InstagramIcon className="app-transition"/>
                        </a>
                        <a className="footer_socials_item" href="https://t.me/maks_k0s" target="_blank" rel="noreferrer">
                            <TelegramIcon className="app-transition"/>
                        </a>
                        <a className="footer_socials_item" href="https://twitter.com/maks_k0s" target="_blank" rel="noreferrer">
                            <TWitterIcon className="app-transition"/>
                        </a>
                    </div>
                    <div className="footer_column footer_main_logo">
                        <MainLogo className="app-transition"/>
                    </div>
                    <div className="footer_column footer_copyright">
                        <p>
                        © All rights reserved
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;