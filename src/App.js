import { useEffect, useState, createContext } from 'react';
import ApiDocs from './pages/Api';
import Header from './components/Header/index.jsx';
import StartScreen from './components/StartScreen/index.jsx';
import HomePage from './pages/HomePage/index.jsx';
import Article from './pages/Article';
import Profile from "./pages/Profile";
import Settings from './pages/Settings/index.jsx';
import PageNotFound from './pages/PageNotFound/index.jsx';
import Footer from "./components/Footer/index.jsx";
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import CreatePost from './pages/CreatePost/index.jsx';
import Toast from "./components/Toast/index.jsx";
import ModalWindow from './components/ModalWindow/index.jsx';

import "./styles/common.scss";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

const AppContext = createContext()

function App() {
  let lsTheme = localStorage.getItem('theme');
  const [ profile, setProfile ] = useState(null)
  const [ profileLoading, setProfileLoading ] = useState(false)
  let [ isDarkTheme, setIsDarkTheme ] = useState(lsTheme ? JSON.parse(lsTheme) : true);
  let [ toast, showToast ] = useState(false);
  let [ modalWindow, showModalWindow ] = useState(false)

  const CssVariables = {
    '--accent-color': isDarkTheme ? '#4e93ff' : "#1b73fb",
    '--gray-16': '#161616',
    '--gray-1e': '#1e1e1e',
    '--gray-25': '#252525',
    '--gray-2f': '#2f2f2f',
    '--gray-33': '#333333',
    '--gray-4f': '#4f4f4f',
    '--gray-63': '#636363',
    '--gray-79': '#797979',
    '--gray-99': '#999999',
    '--gray-b5': '#b5b5b5',
    '--gray-c6': '#c6c6c6',
    '--gray-d7': '#d7d7d7',
    '--gray-e7': '#e7e7e7',
    '--gray-f1': '#f1f1f1',
    '--gray-f9': '#f9f9f9',
    '--gray-ff': '#ffffff',

    '--red-f5': '#ff4545',
    '--red-f1': '#ff5151',

    '--blue-39': '#3b76c9',
    '--blue-8f': '#84aeff',

    '--main-background': isDarkTheme ? 'var(--gray-16)' : 'var(--gray-f1)',
    '--loader-color': isDarkTheme ? 'white' : 'black',
    '--verified-icon-color': '#0095f6',
    '--warning-color': isDarkTheme ? 'rgb(255 191 0)' : 'rgb(255, 179, 0)',
    '--warning-background-color': isDarkTheme ? 'rgb(94, 85, 42, .8)' : 'rgba(255, 245, 163, .8)',
    '--success-color': isDarkTheme ? 'rgb(132 255 148)' : 'rgb(0 139 12)',
    '--success-background-color': isDarkTheme ? 'rgb(72, 90, 73, .8)' : 'rgba(199, 252, 188, .8)',
    '--error-color': isDarkTheme ? 'rgb(246, 0, 0)' : 'rgb(255 14 14)',
    '--error-background-color': isDarkTheme ? 'rgba(92, 62, 62, .8)' : 'rgba(250, 223, 223, .8)',
    '--svg-logo-color': isDarkTheme ? 'white' : '#2f2f2f',
    '--administrator-color': isDarkTheme ? 'var(--red-f5)' : 'red',
    '--line-color': isDarkTheme ? 'var(--gray-4f)' : "#afafaf",
    '--text-color': isDarkTheme ? 'var(--gray-e7)' : 'var(--gray-25)',
    '--main-text-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-25)',
    '--light-text-color': isDarkTheme ? 'var(--gray-63)' : 'var(--gray-79)',
    '--background-text-color': isDarkTheme ? 'var(--gray-25)' : 'var(--gray-e7)',
    '--post-text-color': isDarkTheme ? 'var(--gray-e7)': 'var(--gray-25)',
    '--link-text-color': isDarkTheme? '#c583ff' : '#80f',
    '--author-name-color' : isDarkTheme ? 'var(--gray-d7)' : 'var(--gray-1e)',
    '--author-name-hover-color' : isDarkTheme ? 'var(--gray-f1)' : 'var(--gray-16)',
    '--input-text-color': isDarkTheme ? 'var(--gray-d7)' : 'var(--gray-1e)',
    '--input-background-color': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-f9)',
    '--input-outline-color': isDarkTheme ? 'var(--gray-33)' : 'var(--gray-c6)',
    '--input-outline-active-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-25)',
    '--input-placeholder-color': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-c6)',
    // '--drop-file-background-color': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-f7)',
    '--drop-file-background-color': 'transparent',
    '--drop-file-hover-background-color': isDarkTheme ? 'var(--gray-25)' : 'var(--gray-e7)',
    '--drop-file-border-color': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-b5)',
    '--drop-file-hover-border-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-63)',
    '--avatar-icon-color': 'var(--drop-file-hover-background-color)',
    '--submit-button-primary-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-25)',
    '--submit-button-primary-hover-color': isDarkTheme ? 'var(--gray-e7)' : 'var(--gray-4f)',
    '--submit-button-secondary-color': 'var(--main-background)',
    '--profile-button-text-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-25)',
    '--profile-active-button-text-color': isDarkTheme ? 'var(--gray-16)' : 'var(--gray-e7)',
    '--profile-button-text-hover-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-25)',
    '--profile-button-background-color': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-e7)',
    '--profile-active-button-background-color': isDarkTheme ? 'var(--gray-99)' : 'var(--gray-33)',
    '--profile-active-button-hover-background-color': isDarkTheme ? 'var(--gray-79)' : 'var(--gray-4f)',
    '--profile-button-hover-background-color': isDarkTheme ? 'var(--gray-2f)' : 'var(--gray-d7)',
    '--sticky-button-background-color': isDarkTheme ? 'rgba(22, 22, 22, .8)' : 'rgba(241, 241, 241, .8)',
    '--red-button-primary-color': isDarkTheme ? 'var(--red-f1)' : 'var(--red-f1)',
    '--red-button-secondary-color': isDarkTheme ? 'var(--gray-f1)' : 'var(--main-background)',
    '--blue-button-primary-color': isDarkTheme ? 'var(--blue-8f)' : 'var(--blue-39)',
    '--header-text-color': isDarkTheme ? '--gray-b5' : '#6b6b6b',
    '--header-background': isDarkTheme ? 'rgba(0,0,0, .8)' : 'rgba(255,255,255, .8)',
    '--header-button-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-63)',
    '--header-button-hover-color': isDarkTheme ? 'var(--gray-ff)' : 'var(--gray-16)',
    '--banner-haze': isDarkTheme ? 0 : 1,
    '--post-title-color': isDarkTheme ? 'var(--gray-e7)' : 'var(--gray-25)',
    '--modal-window-body-background-color': isDarkTheme ? 'var(--gray-1e)' : 'white',
    '--modal-window-background-color': isDarkTheme ? 'rgb(0, 0, 0, .8)' : 'rgb(0, 0, 0, .4)',
    '--modal-window-button-color': isDarkTheme ? 'var(--gray-b5)' : 'var(--gray-63)',
    '--modal-window-button-hover-color': isDarkTheme ? 'var(--gray-f1)' : 'var(--gray-1e)',
    '--post-card-background': isDarkTheme ? 'var(--gray-25)' : 'white',
    '--post-card-description-color': isDarkTheme ? 'var(--gray-b5)' : "#6b6b6b",
    '--article-date-color': isDarkTheme ? 'var(--gray-79)' : "var(--gray-79)",
    '--article-topic-button-color': isDarkTheme ? 'var(--gray-79)' : 'var(--gray-79)',
    '--article-topic-button-hover-color': isDarkTheme ? 'var(--gray-d7)' : '#1e1e1e',
    '--article-topic-category-background-color': isDarkTheme ? 'var(--gray-2f)' : 'var(--gray-f1)',
    '--article-topic-category-background-hover-color': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-d7)',
    '--article-topic-category-color': isDarkTheme ? 'var(--gray-99)' : 'var(--gray-4f)',
    '--article-topic-category-hover-color': isDarkTheme ? 'var(--gray-e7)' : 'var(--gray-33)',
    '--footer-background': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-ff)',
    '--footer-line-color': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-e7)',
    '--footer-content-color': isDarkTheme ? 'var(--gray-79)' : 'var(--gray-b5)',
    '--footer-content-hover-color': isDarkTheme ? 'var(--gray-d7)' : 'var(--gray-4f)',

    '--swagger-patch-color': isDarkTheme ? '#237b67' : '#00b1a9',
    '--swagger-post-color': isDarkTheme ? '#237b46' : '#249762',
    '--swagger-main-text-color': isDarkTheme ? '#d3d3d3' : 'black',
    '--swagger-secondary-text-color': isDarkTheme ? '#a3a3a3' : 'black',
    '--swagger-field-background-color': isDarkTheme ? 'rgba(0,0,0, .1)' : 'rgba(255, 255, 255, .5)',
    '--swagger-field-color': isDarkTheme ? 'white' : 'black',
    '--swagger-titles-color': isDarkTheme ? '#a2acc7' : '#3b4151',
    '--swagger-option-background-color': isDarkTheme ? '#1b2229' : '#f1f5f9',
    '--swagger-servers-background-color': isDarkTheme ? 'rgba(89,89,89, .1)' : 'rgba(255,255,255, .4)',

    '--popup-background-color': 'transparent',
    '--popup-button-background-color': isDarkTheme ? 'var(--gray-2f)' : 'var(--gray-d7)',
    '--popup-button-background-hover-color': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-b5)',

    '--dropdown-outline-color': isDarkTheme ? 'var(--gray-25)' : 'var(--gray-c6)',
    '--dropdown-selected-background-color': isDarkTheme ? 'var(--gray-33)' : 'var(--gray-d7)',
    '--dropdown-item-hover-background-color': isDarkTheme ? 'var(--gray-25)' : '',

    '--toggle-track-background': isDarkTheme ? 'var(--gray-4f)' : 'var(--gray-c6)',
    '--toggle-active-track-background': isDarkTheme ? 'var(--gray-d7)' : 'var(--gray-25)',
    '--toggle-thumb-background': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-ff)',
    '--toggle-active-thumb-background': isDarkTheme ? 'var(--gray-1e)' : 'var(--gray-ff)'
  }


  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(isDarkTheme))
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", isDarkTheme ? "#1e1e1e" : "#ffffff" );

  }, [isDarkTheme])

  return (
    <AppContext.Provider value={{profile, setProfile, isDarkTheme, setIsDarkTheme, profileLoading, setProfileLoading, toast, showToast, modalWindow, showModalWindow }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className={`App ${isDarkTheme ? 'App_dark' : ''}`} style={CssVariables}>

          <ModalWindow
            modalWindow={modalWindow}
            showModalWindow={showModalWindow}
          />
          <Header/>
          <StartScreen>
            <Routes>
              
              <Route
                path="*"
                element={<Navigate to="/404" replace />} />
              
              <Route
                path="/"
                element={<Navigate to="/posts" replace />} />

              <Route path="/api" Component={ApiDocs}/>
              <Route path="/auth/login" Component={Login}/>
              <Route path="/auth/register" Component={Register}/>
              <Route path="/404" Component={PageNotFound}/>
              <Route path="/posts/" Component={HomePage}/>
              <Route path="/create-post" Component={CreatePost}/>
              <Route path="/users/:id" Component={Profile}/>
              <Route path="/posts/:id" Component={Article}/>
              <Route path="/settings" Component={Settings}/>
            </Routes>
            
          </StartScreen>
          <Footer></Footer>
          <Toast toast={toast} showToast={showToast}/>
        </div>
      </Router>
    </AppContext.Provider>
  )
}

export { App, AppContext };
