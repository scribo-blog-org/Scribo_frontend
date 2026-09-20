import "./AppStatusScreen.scss";

const AppStatusScreen = ({
    illustration,
    title,
    children,
    actions,
    role = "status",
    live = "polite",
    busy = false,
    label,
}) => (
    <div
        className="app-status"
        role={role}
        aria-live={live}
        aria-busy={busy || undefined}
        aria-label={label || title}
    >
        <div className="app-status_art scribo-illustration" aria-hidden="true">
            {illustration}
        </div>
        <div className="app-status_copy">
            <h1>{title}</h1>
            {children}
            {actions ? <div className="app-status_actions">{actions}</div> : null}
        </div>
    </div>
);

export default AppStatusScreen;
