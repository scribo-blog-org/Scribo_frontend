import "./AppLayout.scss";

const AppLayout = ({ children }) => (
    <div className="app-layout app-transition" id="app-layout">
        {children}
    </div>
);

export default AppLayout;
