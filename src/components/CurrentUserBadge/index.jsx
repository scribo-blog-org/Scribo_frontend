import UserBadge from '../UserBadge/index';
import "./CurrentUserBadge.scss";
import { useContext } from 'react';
import { AppContext } from '../../App';
import { Link } from 'react-router-dom';
import ProfileIcon from "../../assets/svg/profile.svg?react";

const guestIcon = (defaultAvatar) =>
    defaultAvatar ?? <ProfileIcon className="user_badge_guest_icon" aria-hidden="true" />;

const CurrentUserBadge = ({ className, asLink = true, defaultAvatar, avatarOnly = false }) => {
    const { profile } = useContext(AppContext)

    return (
        profile ? 
            <UserBadge data={profile} className={className} asLink={asLink} avatarOnly={avatarOnly} />
        :
        
        asLink ? 
            <Link to={"/auth/login"} className={`user_badge ${className ?? ''} app-transition`}>
                {guestIcon(defaultAvatar)}
            </Link>
        :
            <div className={`user_badge ${className ?? ''} app-transition`}>
                {guestIcon(defaultAvatar)}
            </div>
    )
};

export default CurrentUserBadge;
