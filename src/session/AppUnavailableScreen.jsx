import PrimaryButton from "../components/Ui/PrimaryButton";
import ErrorIllustration from "../assets/svg/illustrations/scribo-server-error.svg?react";
import RetryIcon from "../assets/svg/illustrations/retry.svg?react";
import AppStatusScreen from "./AppStatusScreen";

const AppUnavailableScreen = ({ onRetry, isRetrying = false }) => (
    <AppStatusScreen
        illustration={<ErrorIllustration />}
        title="Упс... у нас ошибка"
        role="alert"
        live="assertive"
        label="Сервер недоступен"
        actions={(
            <PrimaryButton
                type="button"
                onClick={onRetry}
                isLoading={isRetrying}
            >
                <RetryIcon width={16} height={16} />
                Попробовать снова
            </PrimaryButton>
        )}
    >
        <p className="app-status_lead">
            Похоже, что-то пошло не так на сервере.
            <br />
            Мы уже работаем над этим.
        </p>
    </AppStatusScreen>
);

export default AppUnavailableScreen;
