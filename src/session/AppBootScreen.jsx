import "./AppBootScreen.scss";

const AppBootScreen = () => (
    <div
        className="app-boot"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Загрузка приложения"
    >
        <div className="app-boot_inner">
            <div className="app-boot_sheet" aria-hidden="true">
                <div className="app-boot_rules">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <span
                            key={index}
                            className="app-boot_rule app-transition"
                        />
                    ))}
                </div>
                <p className="app-boot_code">
                    <span className="app-boot_dot" />
                    <span className="app-boot_dot" />
                    <span className="app-boot_dot" />
                </p>
                <p className="app-boot_draft">
                    Сессия просыпается
                    <span className="app-boot_caret" />
                </p>
            </div>
            <div className="app-boot_copy">
                <h1>Открываем Scribo</h1>
                <p className="app-boot_lead">
                    Профиль, уведомления и чат — на связи через миг. Без скачков
                    в меню после загрузки.
                </p>
            </div>
        </div>
    </div>
);

export default AppBootScreen;
