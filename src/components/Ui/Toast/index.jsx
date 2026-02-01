import { useEffect, useRef, useState } from "react";
import "./Toast.scss";

const Toast = ({ toast, showToast }) => {
    const timerRef = useRef(null);
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setIsVisible(false);
            setTimeout(() => {
                setIsVisible(true);
                setIsExiting(false);
            }, 10);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    showToast(false);
                    setIsVisible(false);
                }, 300);
            }, 3000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    return (
        <div className={`app-transition toast 
            ${ isVisible ? (isExiting ? "toast_exit" : "toast_active") : ""} 
            ${ toast?.type === "info" ? "toast_type_info" : "" }
            ${ toast?.type === "warning" ? "toast_type_warning" : "" }
            ${ toast?.type === "success" ? "toast_type_success" : "" }
            ${ toast?.type === "error" ? "toast_type_error" : "" }
        `}>
            <p>{toast?.message}</p>
        </div>
    );
};

export default Toast;
