import AppSidebar from "../../components/AppSidebar/index";

import "./AppShell.scss";

const AppShell = ({ children }) => (
    <div className="app-shell">
        <AppSidebar />
        <div className="app-shell_main">{children}</div>
    </div>
);

export default AppShell;
