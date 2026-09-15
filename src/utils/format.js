function format_date_time(date) {
    date = new Date(date);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes} - ${day}.${month}.${year}`;
}

function format_time(date) {
    date = new Date(date);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

const MESSAGE_DATE_MONTHS = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
];

function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}

function format_message_date_label(date) {
    const target = startOfDay(date);
    const today = startOfDay(new Date());
    const diffDays = Math.round((today - target) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
        return 'Сегодня';
    }

    if (diffDays === 1) {
        return 'Вчера';
    }

    const day = target.getDate();
    const month = MESSAGE_DATE_MONTHS[target.getMonth()];
    const year = target.getFullYear();

    if (year === today.getFullYear()) {
        return `${day} ${month}`;
    }

    return `${day} ${month} ${year}`;
}

function is_same_calendar_day(left, right) {
    const leftDate = new Date(left);
    const rightDate = new Date(right);

    return (
        leftDate.getFullYear() === rightDate.getFullYear() &&
        leftDate.getMonth() === rightDate.getMonth() &&
        leftDate.getDate() === rightDate.getDate()
    );
}

const format_back = (date_time) => {
    if (!date_time) return "";

    const now = new Date();
    const past = new Date(date_time);
    const diffInMs = now - past;

    if (diffInMs < 0) return "только что";

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    const pluralize = (number, titles) => {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[
            (number % 100 > 4 && number % 100 < 20) 
                ? 2 
                : cases[(number % 10 < 5) ? number % 10 : 5]
        ];
    };

    if (diffInSeconds < 60) {
        if (diffInSeconds <= 0) return "только что";
        return `${diffInSeconds} ${pluralize(diffInSeconds, ["секунду", "секунды", "секунд"])} назад`;
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${pluralize(diffInMinutes, ["минуту", "минуты", "минут"])} назад`;
    }

    if (diffInHours < 24) {
        return `${diffInHours} ${pluralize(diffInHours, ["час", "часа", "часов"])} назад`;
    }

    if (diffInDays < 30) {
        return `${diffInDays} ${pluralize(diffInDays, ["день", "дня", "дней"])} назад`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} ${pluralize(diffInMonths, ["месяц", "месяца", "месяцев"])} назад`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${pluralize(diffInYears, ["год", "года", "лет"])} назад`;
};

function getCategoryColorType(categoryName) {
    switch (categoryName?.toLowerCase()) {
        case "новости":
            return 1
        case "политика":
            return 2
        case "dev":
            return 3
        case "другое":
            return 4
        default:
            return 0
    }
}
export {
    format_date_time,
    format_time,
    format_message_date_label,
    is_same_calendar_day,
    format_back,
    getCategoryColorType
}