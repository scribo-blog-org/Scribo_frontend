import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../App';
import './Header.scss';
import { getUsers, read_notifications } from '../../api/users.api';
import { ReactComponent as HomeIcon } from "../../assets/svg/home-icon.svg";
import { ReactComponent as SunIcon } from "../../assets/svg/sun-icon.svg";
import { ReactComponent as MoonIcon } from "../../assets/svg/moon-icon.svg";
import { ReactComponent as MainLogo } from "../../assets/svg/main-logo-icon.svg";
import { ReactComponent as DefaultProfileIcon } from "../../assets/svg/profile-icon.svg";
import { ReactComponent as NotificationIcon } from "../../assets/svg/notification-icon.svg";
import Author from "../Author"

function Header() {
  const { showToast, profile, setProfile, setIsDarkTheme, isDarkTheme, showModalWindow } = useContext(AppContext)

  const get_notification = async (notifications) => {
    const get_time = (time) => {
      if(!time) {
        return ""
      }
      
      const now = new Date();
      const past = new Date(time);
      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 60) {
          return `${diffInSeconds} секунд назад`;
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
          return `${diffInMinutes} минут назад`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
          return `${diffInHours} часов назад`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 31) {
          return `${diffInDays} дней назад`;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
          return `${diffInMonths} месяцев назад`;
      }

      const diffInYears = Math.floor(diffInMonths / 12);
      return `${diffInYears} лет назад`;
    }

    let users = await getUsers(
      notifications.map(item => ({ _id: item.user }))
    );

    const userMap = users.data.reduce((acc, u) => (acc[u._id] = u, acc), {});

    return [...notifications].reverse().map((item, index) => (
      <div key={item._id} className="modal_window_body_content_notification">
        <div className='modal_window_body_content_notification_new'>
          {
            !item.is_read ?
                <div className="modal_window_body_content_notification_new_circle"></div>
              :
                <></>
          }
          <Author author_data={userMap[item.user]} />
        </div>
        <p className='modal_window_body_content_notification_message'>
          {(() => {
            switch (item.type) {
              case "follow":
                  return "Подписался(-ась) на ваши обновления"
                case "unfollow":
                  return "Отписался(-ась) от вас"
                default:
                  return ""
                }
            })()}
        </p>
        <p className='modal_window_body_content_notification_time'>{get_time(item.time)}</p>
      </div>
    ));
  };
  
  const open_notifications = async () => {
    if(!profile) {
      showToast({type: "warning", message: "Войдите в аккаунт, чтоб получать уведомления!"})
      return
    }

    const notificationContent = await get_notification(profile?.notifications);
  
    const update_notification = async () => {
      const result = await read_notifications()
      if(result.status === true){
        setProfile({ 
          ...profile, 
          notifications: profile.notifications.map((item) => ({ ...item, is_read: true }))
        });
      }
    }

    showModalWindow({
      title: `Уведомления`,
      content: notificationContent,
      close_func: update_notification
    });
  };

  return (
    <header className="header blurred app-transition">
      <div className="container">
        <div className="header_content">
          <div className="header_side header_left_side">
            <Link to={'/posts'} className='header_item header-button'>
              <HomeIcon className='header_icon app-transition'/>
            </Link>
          </div>
          <div  className="header_main_logo">
            <MainLogo className='app-transition'/>
          </div>
          <div className="header_side header_right_side">
            <button type='button' onClick={() => { open_notifications() }} className='header_item header_notification'>
              {
                profile?.notifications?.some(item => item.is_read === false ) 
                  ? 
                    <div className='header_notification_new'>
                      <div className='header_notification_new_circle'></div>
                    </div>
                  :
                    <></>
              }
              <NotificationIcon className="app-transition"/>
            </button>
            <button type='button' onClick={() => setIsDarkTheme(!isDarkTheme)} className='header_item'>
              {isDarkTheme ? <SunIcon className='app-transition'></SunIcon> : <MoonIcon className='app-transition'></MoonIcon>}
            </button> 
            <div className='header_profile'>
              {
                profile ? 
                  <Author author_data={ profile } class_name={"header_profile_author"}/> 
                :
                <Link to={"auth/login"} className='header_item'>
                  <DefaultProfileIcon className='app-transition' />
                </Link>
              }
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
