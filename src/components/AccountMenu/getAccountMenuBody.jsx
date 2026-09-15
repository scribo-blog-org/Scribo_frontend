import DefaultProfileIcon from "../../assets/svg/profile.svg?react";
import SettingsIcon from "../../assets/svg/settings.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import RedirectIcon from "../../assets/svg/redirect.svg?react";
import LogoutIcon from "../../assets/svg/logout.svg?react";

export const isAdminRole = (role) => ["admin", "tech_admin"].includes(role);

export function getAccountMenuBody({
    profile,
    location,
    navigate,
    setProfile,
    showToast,
    logout,
}) {
    return [
        [
            {
                title: "В профиль",
                icon: <DefaultProfileIcon />,
                onClick: () => { navigate(`/users/${profile.nick_name}`) }
            },
            {
                title: "Настройки",
                icon: <SettingsIcon />,
                onClick: () => { navigate(`/settings`) }
            },
            {
                title: "Поддержка",
                icon: <CommentIcon />,
                onClick: () => { navigate("/support/mine") }
            },
        ],
        isAdminRole(profile?.role)
            ? [{
                title: location.pathname.startsWith("/admin-panel")
                    ? "Домой"
                    : "В админ панель",
                icon: <RedirectIcon />,
                onClick: () => navigate(
                    location.pathname.startsWith("/admin-panel")
                        ? "/posts"
                        : "/admin-panel?tab=dashboard"
                )
            }]
            : [],
        [
            {
                title: "Выйти с акаунта",
                icon: <LogoutIcon />,
                type: "danger",
                onClick: () => {
                    setProfile(null);
                    logout().then(() => {
                        showToast({ type: "success", message: "Вы вышли из аккаунта!" })
                        navigate("/posts")
                    })
                }
            }
        ]
    ];
}
