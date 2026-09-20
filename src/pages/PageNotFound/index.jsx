import { useNavigate, useLocation } from "react-router-dom";

import PrimaryButton from "../../components/Ui/PrimaryButton";
import "./PageNotFound.scss";

const PageNotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="page_not_found">
            <div className="page_not_found_sheet" aria-hidden="true">
                <div className="page_not_found_rules">
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                    <span className="page_not_found_rule app-transition" />
                </div>
                <p className="page_not_found_code">
                    4<span className="page_not_found_zero" />4
                </p>
                <p className="page_not_found_draft">
                    {`${import.meta.env.VITE_APP_API_URL}${location.pathname}`}
                    <span className="page_not_found_caret" />
                </p>
            </div>
            <div className="page_not_found_copy">
                <h1>Страница не найдена</h1>
                <p className="page_not_found_lead">
                    Здесь пока пусто. Возможно черновик навсегда остался в голове автора.
                </p>
                <PrimaryButton type="button" onClick={() => navigate("/posts")}>
                    На главную
                </PrimaryButton>
            </div>
        </div>
    );
};

export default PageNotFound;