import { useLocation } from "react-router-dom";

import { getRouteSeo } from "../../seo/routeSeo";
import PageSeo from "./index";

function RouteSeo() {
    const { pathname } = useLocation();
    const seo = getRouteSeo(pathname);

    return <PageSeo {...seo} />;
}

export default RouteSeo;
