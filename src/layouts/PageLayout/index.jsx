import { Outlet } from "react-router-dom";

import "./PageLayout.scss";

const PageLayout = () => (
    <div className="page-layout">
        <Outlet />
    </div>
);

export default PageLayout;
