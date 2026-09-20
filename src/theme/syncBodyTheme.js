/** Theme canvas lives on body. Never touch document.documentElement for theme. */

export function syncBodyThemeClass(isDarkTheme) {
    const hasDarkClass = document.body.classList.contains("dark-theme");

    if (hasDarkClass === isDarkTheme) {
        return;
    }

    document.body.classList.toggle("dark-theme", isDarkTheme);
}

export function syncMetaThemeColor(isDarkTheme) {
    const next = isDarkTheme ? "#1e1e1e" : "#ffffff";
    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta && meta.getAttribute("content") !== next) {
        meta.setAttribute("content", next);
    }
}

export function syncAccentAndCategoryVars(isDarkTheme, categoryColors, accentColor) {
    Object.values(categoryColors).forEach((color) => {
        document.body.style.setProperty(
            color.variable,
            isDarkTheme ? color.dark : color.light
        );
    });

    document.body.style.setProperty(
        accentColor.variable,
        isDarkTheme ? accentColor.dark : accentColor.light
    );
}
