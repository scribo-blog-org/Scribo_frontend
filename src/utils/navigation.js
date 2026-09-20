const isPathActive = (pathname, path) => {
    if (!path) {
        return false;
    }

    if (path === "/posts") {
        return pathname === "/posts" || pathname === "/posts/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
};

const scrollToTop = () => {
    const opts = { top: 0, left: 0, behavior: "auto" };

    document.querySelector(".app-shell_content")?.scrollTo(opts);
};

const scrollTo = (object, block = "center") => {
    document.getElementById(object)?.scrollIntoView({
        behavior: "smooth",
        block,
    });
};

const handleSameRouteClick = (event, pathname, path) => {
    if (!isPathActive(pathname, path)) {
        return;
    }

    event.preventDefault();
    scrollToTop();
};

const navigateOrScrollTop = (navigate, pathname, path) => {
    if (isPathActive(pathname, path)) {
        scrollToTop();
        return;
    }

    navigate(path);
};

export { scrollTo, scrollToTop, isPathActive, handleSameRouteClick, navigateOrScrollTop };
