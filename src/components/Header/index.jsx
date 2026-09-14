import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { AppContext } from "../../App";
import { getUnreadCount } from "../../api/chat.api";
import { socketService } from "../../sockets/socket.service";

import "./Header.scss";

import { logout } from "../../api/auth.api";

import SunIcon from "../../assets/svg/sun.svg?react";
import MoonIcon from "../../assets/svg/moon.svg?react";
import MainLogo from "../../assets/svg/full-logo-icon.svg?react";
import DefaultProfileIcon from "../../assets/svg/profile.svg?react";
import NotificationIcon from "../../assets/svg/notification.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import SearchIcon from "../../assets/svg/search.svg?react";
import PlusIcon from "../../assets/svg/plus-icon.svg?react";
import ArrowDownIcon from "../../assets/svg/chevron-down.svg?react";
import RedirectIcon from "../../assets/svg/redirect.svg?react";

import CurrentUserBadge from "../CurrentUserBadge/index";
import PrimaryButton from "../Ui/PrimaryButton/index";
import ActionButton from "../Ui/ActionButton/index";
import Popup from "../Ui/Popup/index";
import { getAccountMenuBody } from "../AccountMenu/getAccountMenuBody";
import { handleSameRouteClick } from "../../utils/navigation.js";

function Header() {
	const { showToast, profile, setProfile, setIsDarkTheme, isDarkTheme } =
		useContext(AppContext);

	const navigate = useNavigate();
	const location = useLocation();
	const [unreadMessages, setUnreadMessages] = useState(0);

	useEffect(() => {
		if (!profile) {
			setUnreadMessages(0);
			return;
		}

		let cancelled = false;

		getUnreadCount().then((result) => {
			if (!cancelled && result?.status) {
				setUnreadMessages(result.data?.unread || 0);
			}
		});

		const unsubscribe = socketService.on("chat:unread", (unread) => {
			setUnreadMessages(Number(unread) || 0);
		});

		return () => {
			cancelled = true;
			unsubscribe();
		};
	}, [profile?._id]);

	return (
		<header className="header blurred app-transition">
			<div className="header_content">
				<div className="header_side header_left_side">
					<Link
						to="/posts"
						className="header_main_logo"
						onClick={(event) => handleSameRouteClick(event, location.pathname, "/posts")}
					>
						<MainLogo className="header_icon app-transition" />
					</Link>
				</div>
				<div className="header_side header_right_side">
					{["admin", "tech_admin"].includes(profile?.role) ? (
						<>
							{location.pathname.startsWith(
								"/admin-panel"
							) ? (
								<ActionButton
									className="header_admin_button"
									onClick={() => {
										navigate("/posts");
									}}
								>
									<RedirectIcon />
									Домой
								</ActionButton>
							) : (
								<ActionButton
									className="header_admin_button"
									onClick={() => {
										navigate(
											"/admin-panel?tab=dashboard"
										);
									}}
								>
									<RedirectIcon />В админ панель
								</ActionButton>
							)}
						</>
					) : (
						<></>
					)}
					{profile &&
					profile.permissions.includes("create_post") ? (
						<PrimaryButton
							className="header_admin_button header_admin_button_create"
							onClick={() => {
								navigate("/create-post");
							}}
						>
							<PlusIcon />
							Создать пост
						</PrimaryButton>
					) : (
						<></>
					)}
					{profile ? (
						<Link
							to="/messages"
							className={`header_item header_notification app-transition ${location.pathname.startsWith("/messages") ? "header_item_active" : ""}`}
							aria-label="Сообщения"
							onClick={(event) => handleSameRouteClick(event, location.pathname, "/messages")}
						>
							{unreadMessages > 0 ? (
								<div className="header_messages_badge">
									{unreadMessages > 99 ? "99+" : unreadMessages}
								</div>
							) : null}
							<CommentIcon className="header_item_icon app-transition" />
						</Link>
					) : null}
					<Link
						to="/search"
						className={`header_item app-transition ${location.pathname.startsWith("/search") ? "header_item_active" : ""}`}
						aria-label="Поиск"
						onClick={(event) => handleSameRouteClick(event, location.pathname, "/search")}
					>
						<SearchIcon className="header_item_icon app-transition" />
					</Link>
					<Link
						to="/notifications"
						className="header_item header_notification app-transition"
						onClick={(event) => handleSameRouteClick(event, location.pathname, "/notifications")}
					>
						{profile?.notifications?.some(
							(item) => item.is_read === false
						) ? (
							<div className="header_notification_new">
								<div className="header_notification_new_circle"></div>
							</div>
						) : (
							<></>
						)}
						<NotificationIcon className="header_item_icon app-transition" />
					</Link>
					<button
						type="button"
						onClick={() => setIsDarkTheme(!isDarkTheme)}
						className="header_item app-transition"
					>
						{isDarkTheme ? (
							<MoonIcon className="header_item_icon app-transition"></MoonIcon>
						) : (
							<SunIcon className="header_item_icon app-transition"></SunIcon>
						)}
					</button>
					{profile ? (
						<Popup
							className="header_user_badge_popup app-transition"
							body={getAccountMenuBody({
								profile,
								location,
								navigate,
								setProfile,
								showToast,
								logout,
							})}
						>
							<CurrentUserBadge
								asLink={false}
								defaultAvatar={
									<DefaultProfileIcon className="header_item_icon app-transition" />
								}
							/>
							<ArrowDownIcon className="header_item_icon header_user_badge_popup_arrow app-transition" />
						</Popup>
					) : (
						<CurrentUserBadge
							asLink={true}
							className={"header_item"}
							defaultAvatar={
								<DefaultProfileIcon className="header_item_icon app-transition" />
							}
						/>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;
