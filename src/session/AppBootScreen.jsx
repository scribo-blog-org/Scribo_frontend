import LoadingIllustration from "../assets/svg/illustrations/scribo-loading.svg?react";
import AppStatusScreen from "./AppStatusScreen";

const AppBootScreen = () => (
    <AppStatusScreen
        illustration={(
            <>
                <LoadingIllustration />
                <span className="app-boot-spinner" aria-hidden="true">
                    <span className="app-boot-spinner_ring" />
                </span>
            </>
        )}
        title="Загружаем..."
        busy
        label="Загрузка приложения"
    >
        <p className="app-status_lead">
            Это может занять несколько секунд.
            <br />
            Спасибо за терпение.
        </p>
    </AppStatusScreen>
);

export default AppBootScreen;
