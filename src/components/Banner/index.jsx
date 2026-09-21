import { Link } from "react-router-dom";

import GhIcon from "../../assets/svg/github-icon.svg?react";
import ProfileIcon from "../../assets/svg/profile-icon.svg?react";
import ChevronRightIcon from "../../assets/svg/chevron-right.svg?react";

import "./Banner.scss";

const Banner = () => (
    <aside className="banner">
        <p className="banner_kicker">Личный проект</p>
        <p className="banner_lead">Пишу, когда есть что сказать — без редакции.</p>
        <div className="banner_links">
            <a
                className="banner_link app-transition-color"
                href="https://github.com/MaksimKosyanchuk"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub MaksimKosyanchuk"
            >
                <GhIcon className="banner_link_icon" aria-hidden="true" />
                <span className="banner_link_copy">
                    <span className="banner_link_label">GitHub</span>
                    <span className="banner_link_hint">MaksimKosyanchuk</span>
                </span>
                <ChevronRightIcon className="banner_link_chevron" aria-hidden="true" />
            </a>
            <Link
                className="banner_link app-transition-color"
                to="/users/Maks"
                aria-label="Профиль на этом сайте"
            >
                <ProfileIcon className="banner_link_icon" aria-hidden="true" />
                <span className="banner_link_copy">
                    <span className="banner_link_label">Мой профиль</span>
                    <span className="banner_link_hint">на scribo</span>
                </span>
                <ChevronRightIcon className="banner_link_chevron" aria-hidden="true" />
            </Link>
        </div>
    </aside>
);

export default Banner;
