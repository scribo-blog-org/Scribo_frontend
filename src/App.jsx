import { useEffect, Suspense, useState, createContext, lazy } from 'react';

import DefaultContainer from './layouts/DefaultContainer/index';

const ApiDocs = lazy(() => import('./pages/Api/index.jsx'));

import PageNotFound from './pages/PageNotFound/index.jsx';
import HomePage from './pages/HomePage/index.jsx';
import SearchPage from './pages/Search/index.jsx';
import Article from './pages/Article/index.jsx';
import Profile from './pages/Profile/index.jsx';
import Settings from './pages/Settings/index.jsx';
import Login from './pages/Login/index.jsx';
import ForgotPassword from './pages/ForgotPassword/index.jsx';
import Register from './pages/Register/index.jsx';
import CreatePost from './pages/CreatePost/index.jsx';
import EditPost from './pages/EditPost/index.jsx';
import AdminPanel from './pages/AdminPanel/index.jsx';
import Support from './pages/Support/index.jsx';
import SupportMine from './pages/Support/Mine.jsx';
import SupportRequestPage from './pages/Support/Request.jsx';
import Notifications from './pages/Notifications/index.jsx';
import Messages from './pages/Messages/index.jsx';
import RequestDetailPage from './pages/AdminPanel/RequestDetail.jsx';

import AppLayout from './layouts/AppLayout/index.jsx';
import AppShell from './layouts/AppShell/index.jsx';
import FullContainer from './layouts/FullContainer/index.jsx';
import PageLayout from './layouts/PageLayout/index.jsx';

import ModalWindow from './components/Ui/ModalWindow/index.jsx';
import Header from './components/Header/index.jsx';
import Footer from './components/Footer/index.jsx';
import Toast from './components/Ui/Toast/index.jsx';

import MobileNavigationBar from './components/MobileNavigationBar/index.jsx';
import ScrollToTop from './components/ScrollToTop/index.jsx';
import RouteSeo from './components/Seo/RouteSeo.jsx';

import { ACCENT_COLOR, CATEGORY_COLORS } from './styles/constants.js';
import { getAccessToken, setAccessToken, subscribeAccessToken, refreshAccessToken } from './api/http.js';

import "./styles/common.scss";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";

const AppContext = createContext()

function AppModals({ modalWindow, showModalWindow, modalCloseRequest }) {
  const location = useLocation();

  return (
    <ModalWindow
      modalWindow={modalWindow}
      showModalWindow={showModalWindow}
      modalCloseRequest={modalCloseRequest}
      dismissKey={location.key}
    />
  );
}

function AppFooter() {
  const location = useLocation();

  if (location.pathname.startsWith("/messages")) {
    return null;
  }

  return <Footer />;
}

function App() {
  let lsTheme = localStorage.getItem('theme');
  const [ profile, setProfile ] = useState(null)
  const [ profileLoading, setProfileLoading ] = useState(true)
  let [ isDarkTheme, setIsDarkTheme ] = useState(lsTheme ? JSON.parse(lsTheme) : true);
  let [ toast, showToast ] = useState(false);
  let [ modalWindow, showModalWindow ] = useState(false)
  const [ modalCloseRequest, setModalCloseRequest ] = useState(0)
  const [ accessToken, setAccessTokenState ] = useState(getAccessToken())
  const [ authReady, setAuthReady ] = useState(false)
  const requestCloseModal = () => setModalCloseRequest(c => c + 1)

  useEffect(() => {
    return subscribeAccessToken(setAccessTokenState)
  }, [])

  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      try {
        await refreshAccessToken()
      } finally {
        if (!cancelled) {
          setAuthReady(true)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])


  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(isDarkTheme));

    document.body.classList.toggle('dark-theme', isDarkTheme);

    const metaThemeColor = document.querySelector(
      'meta[name="theme-color"]'
    );

    metaThemeColor?.setAttribute(
      'content',
      isDarkTheme ? '#1e1e1e' : '#ffffff'
    );
  }, [isDarkTheme]);

  useEffect(() => {
    Object.values(CATEGORY_COLORS).forEach(color => {
        document.body.style.setProperty(
            color.variable,
            isDarkTheme ? color.dark : color.light
        );
    });

    document.body.style.setProperty(
        ACCENT_COLOR.variable,
        isDarkTheme ? ACCENT_COLOR.dark : ACCENT_COLOR.light
    );
  }, [isDarkTheme]);

  return (
    <AppContext.Provider value={{profile, setProfile, isDarkTheme, setIsDarkTheme, profileLoading, setProfileLoading, toast, showToast, modalWindow, showModalWindow, requestCloseModal, accessToken, setAccessToken, authReady }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <RouteSeo />
          <div className={"App"} id="app-root">
            <AppLayout>
              <AppModals
                modalWindow={modalWindow}
                showModalWindow={showModalWindow}
                modalCloseRequest={modalCloseRequest}
              />
              <AppShell>
                <Header/>
                <MobileNavigationBar/>

                <Suspense fallback={null}>
                    <Routes>
                        <Route element={<PageLayout/>}>
                            <Route element={<DefaultContainer/>}>

                                <Route
                                    path="/"
                                    element={<Navigate to="/posts" replace />}
                                />

                                <Route path="posts/:id/edit" Component={EditPost}/>
                                <Route path="/auth/login" Component={Login}/>
                                <Route path="/auth/forgot-password" Component={ForgotPassword}/>
                                <Route path="/api" Component={ApiDocs}/>
                                <Route path="/auth/register" Component={Register}/>
                                <Route path="/404" Component={PageNotFound}/>
                                <Route path="/posts/" Component={HomePage}/>
                                <Route path="/search" Component={SearchPage}/>
                                <Route path="/create-post" Component={CreatePost}/>
                                <Route path="/users/:id" Component={Profile}/>
                                <Route path="/posts/:id" Component={Article}/>
                                <Route path="/notifications" Component={Notifications}/>
                                <Route path="/support" Component={Support}/>
                                <Route path="/support/mine" Component={SupportMine}/>
                                <Route path="/support/:key" Component={SupportRequestPage}/>
                                <Route path="*" Component={PageNotFound}/>

                            </Route>

                            <Route element={<FullContainer/>}>
                                <Route path="/messages" Component={Messages}/>
                                <Route path="/messages/:conversationId" Component={Messages}/>
                                <Route path="/settings" Component={Settings}/>
                                <Route path="admin-panel" Component={AdminPanel}/>
                                <Route path="admin-panel/requests/:id" Component={RequestDetailPage}/>
                            </Route>
                        </Route>
                    </Routes>
                </Suspense>
                <AppFooter />
                <Toast toast={toast} showToast={showToast}/>
              </AppShell>
            </AppLayout>
          </div>
      </Router>
    </AppContext.Provider>
  )
}

export { App, AppContext };
