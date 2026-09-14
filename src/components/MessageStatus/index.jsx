import ClockIcon from "../../assets/svg/clock.svg?react";

import "./MessageStatus.scss";

const MessageStatus = ({ status }) => {
    if (!status) {
        return null;
    }

    if (status === "sending") {
        return (
            <span className="message_status message_status_sending" aria-label="Отправляется">
                <ClockIcon />
            </span>
        );
    }

    if (status === "sent") {
        return (
            <span className="message_status message_status_sent" aria-label="Отправлено">
                ✓
            </span>
        );
    }

    return (
        <span className="message_status message_status_read" aria-label="Прочитано">
            ✓✓
        </span>
    );
};

export default MessageStatus;
