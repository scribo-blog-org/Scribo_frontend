import ReactDOM from "react-dom/client";
import { App } from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@fontsource/geist";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);

function releaseHtmlBootBackground() {
    const html = document.documentElement;

    const tryRelease = () => {
        const bodyBg = getComputedStyle(document.body).backgroundColor;

        if (bodyBg === "rgba(0, 0, 0, 0)" || bodyBg === "transparent") {
            requestAnimationFrame(tryRelease);
            return;
        }

        html.style.backgroundColor = "";
    };

    requestAnimationFrame(tryRelease);
}

releaseHtmlBootBackground();
