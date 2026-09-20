import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppContext } from "../../App";
import { getDashboard } from "../../api/analytics.api";
import { hashtagSearchPath } from "../../utils/hashtags";

import ChipButton from "../../components/Ui/ChipButton";
import Loading from "../../components/Ui/Loading";

import "./Dashboard.scss";

const RANGES = [
    { value: "24h", label: "24 часа" },
    { value: 7, label: "7 дней" },
    { value: 14, label: "14 дней" },
    { value: 30, label: "30 дней" },
];

const TRAFFIC_KEYS = [
    { key: "visits", label: "Посещения", color: "var(--text-color)" },
];

const formatDay = (iso) => {
    const date = new Date(`${iso}T00:00:00Z`);
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
    });
};

const formatHour = (iso) => {
    const date = new Date(`${iso}:00:00Z`);
    return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatRange = (range) => {
    if (range === "24h") {
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        const options = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
        return `${start.toLocaleString("ru-RU", options)} — ${end.toLocaleString("ru-RU", options)}`;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range + 1);
    const options = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("ru-RU", options)} — ${end.toLocaleDateString("ru-RU", options)}`;
};

const formatNumber = (value) => new Intl.NumberFormat("ru-RU").format(value || 0);

const deltaLabel = (current, previous) => {
    if (previous == null) {
        return null;
    }

    const curr = Number(current || 0);
    const prev = Number(previous || 0);

    if (!prev && !curr) {
        return null;
    }

    if (!prev) {
        return { text: "Нет данных за прошлый период", tone: "flat" };
    }

    const abs = curr - prev;
    if (abs === 0) {
        return { text: "без изменений", tone: "flat" };
    }

    return {
        text: `${abs > 0 ? "+" : ""}${formatNumber(abs)} к прошлому периоду`,
        tone: abs > 0 ? "up" : "down",
    };
};

const TrendChart = ({ series, keys, hourly = false }) => {
    const formatTick = hourly ? formatHour : formatDay;
    const [hover, setHover] = useState(null);
    const [cursor, setCursor] = useState(null);
    const width = 720;
    const height = 248;
    const pad = { top: 16, right: 12, bottom: 32, left: 36 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;

    const maxValue = Math.max(
        1,
        ...series.flatMap((point) => keys.map((item) => Number(point[item.key] || 0))),
    );

    const moveCursor = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setCursor({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            w: rect.width,
            h: rect.height,
        });
    };

    const toX = (index) => {
        if (series.length <= 1) {
            return pad.left;
        }
        return pad.left + (index / (series.length - 1)) * innerWidth;
    };

    const toY = (value) => pad.top + innerHeight - (value / maxValue) * innerHeight;

    const polylines = keys.map((item) => ({
        ...item,
        points: series
            .map((point, index) => `${toX(index)},${toY(Number(point[item.key] || 0))}`)
            .join(" "),
    }));

    const areaPath = (() => {
        if (!series.length) {
            return "";
        }
        const first = polylines[0];
        const start = `${toX(0)},${toY(0)}`;
        const end = `${toX(series.length - 1)},${toY(0)}`;
        return `M ${start} L ${first.points} L ${end} Z`;
    })();

    const ticks = series.filter((_, index) => {
        if (series.length <= 8) {
            return true;
        }
        return index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 6) === 0;
    });

    const yTicks = [0, 0.5, 1].map((ratio) => Math.round(maxValue * ratio));
    const hitWidth = series.length ? innerWidth / series.length : innerWidth;
    const active = hover != null ? series[hover] : null;

    const tooltipStyle = cursor
        ? {
            left: cursor.x,
            top: cursor.y,
            transform: `translate(${cursor.x > cursor.w * 0.62 ? "calc(-100% - 12px)" : "12px"}, ${
                cursor.y > cursor.h * 0.7 ? "calc(-100% - 8px)" : "8px"
            })`,
        }
        : undefined;

    return (
        <div
            className="analytics_chart_wrap"
            onMouseMove={moveCursor}
            onMouseLeave={() => {
                setHover(null);
                setCursor(null);
            }}
        >
            <svg className="analytics_chart" viewBox={`0 0 ${width} ${height}`} role="img">
                {yTicks.map((value) => (
                    <g key={value}>
                        <line
                            className="analytics_chart_grid"
                            x1={pad.left}
                            y1={toY(value)}
                            x2={pad.left + innerWidth}
                            y2={toY(value)}
                        />
                        <text className="analytics_chart_ytick" x={pad.left - 8} y={toY(value) + 3} textAnchor="end">
                            {formatNumber(value)}
                        </text>
                    </g>
                ))}
                {areaPath ? (
                    <path className="analytics_chart_area" d={areaPath} fill={keys[0]?.color} />
                ) : null}
                {polylines.map((line) => (
                    <polyline
                        key={line.key}
                        className="analytics_chart_line"
                        points={line.points}
                        stroke={line.color}
                        fill="none"
                    />
                ))}
                {active ? (
                    <g className="analytics_chart_hint">
                        <line
                            className="analytics_chart_guide"
                            x1={toX(hover)}
                            y1={pad.top}
                            x2={toX(hover)}
                            y2={pad.top + innerHeight}
                        />
                        {keys.map((item) => (
                            <circle
                                key={item.key}
                                className="analytics_chart_dot"
                                cx={toX(hover)}
                                cy={toY(Number(active[item.key] || 0))}
                                r={4}
                                fill={item.color}
                            />
                        ))}
                    </g>
                ) : null}
                {series.map((point, index) => (
                    <rect
                        className="app-transition"
                        key={`hit-${point.date}`}
                        x={toX(index) - hitWidth / 2}
                        y={pad.top}
                        width={hitWidth}
                        height={innerHeight}
                        fill="transparent"
                        onMouseEnter={() => setHover(index)}
                    />
                ))}
                {ticks.map((point) => {
                    const index = series.indexOf(point);
                    return (
                        <text
                            key={point.date}
                            className="analytics_chart_tick"
                            x={toX(index)}
                            y={height - 8}
                            textAnchor="middle"
                        >
                            {formatTick(point.date)}
                        </text>
                    );
                })}
            </svg>
            {active && cursor ? (
                <div className="analytics_chart_tooltip" style={tooltipStyle}>
                    <p>{formatTick(active.date)}</p>
                    {keys.map((item) => (
                        <p key={item.key}>
                            {item.label}: {formatNumber(active[item.key])}
                        </p>
                    ))}
                </div>
            ) : null}
            {keys.length > 1 ? (
                <div className="analytics_legend">
                    {keys.map((item) => (
                        <span className="analytics_legend_item" key={item.key}>
                            <span className="analytics_legend_swatch" style={{ background: item.color }} />
                            {item.label}
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

const RankedBars = ({ items, empty, wideLabel }) => {
    const maxValue = Math.max(1, ...items.map((item) => item.count || item.visits || 0));

    if (!items.length) {
        return <p className="analytics_empty">{empty || "Нет данных за период"}</p>;
    }

    return (
        <div className={`analytics_bars${wideLabel ? " analytics_bars_wide" : ""}`}>
            {items.map((item) => {
                const label = item.label || item.type || item.path || item.query || item.tag || item.title;
                const value = item.count ?? item.visits ?? item.views_count ?? 0;
                const note = item.note || null;

                return (
                    <div className="analytics_bars_row" key={item.key || label}>
                        {item.href ? (
                            <Link
                                className={`analytics_bars_label${item.hashtag ? " hashtag" : ""}`}
                                to={item.href}
                                title={label}
                            >
                                {label}
                            </Link>
                        ) : (
                            <p className="analytics_bars_label" title={label}>{label}</p>
                        )}
                        <div className="analytics_bars_track">
                            <div
                                className="analytics_bars_fill app-transition"
                                style={{ width: `${Math.max(6, (value / maxValue) * 100)}%` }}
                            />
                        </div>
                        <p className="analytics_bars_value">
                            {item.valueLabel || formatNumber(value)}
                            {note ? <span> · {note}</span> : null}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

const AnalyticsGroup = ({ title, hint, className, children }) => (
    <section className={`analytics_group ${className || ""}`.trim()}>
        <div className="analytics_group_head">
            <h2 className="kicker">{title}</h2>
            {hint ? <p className="analytics_group_hint">{hint}</p> : null}
        </div>
        {children}
    </section>
);

const AnalyticsScope = ({ title, hint, className, children }) => (
    <section className={`analytics_scope ${className || ""}`.trim()}>
        <header className="analytics_scope_head">
            <h2 className="kicker">{title}</h2>
            {hint ? <p className="analytics_scope_hint">{hint}</p> : null}
        </header>
        <div className="analytics_scope_body">{children}</div>
    </section>
);

const StatCard = ({ label, value, previous, hint }) => {
    const delta = previous == null ? null : deltaLabel(value, previous);

    return (
        <div className="analytics_stat app-transition">
            <p className="analytics_stat_label">{label}</p>
            <p className="analytics_stat_value">{formatNumber(value)}</p>
            {hint ? <p className="analytics_stat_hint">{hint}</p> : null}
            {delta ? (
                <p className={`analytics_stat_delta analytics_stat_delta_${delta.tone}`}>{delta.text}</p>
            ) : null}
        </div>
    );
};

const ActivityMetric = ({ label, value }) => (
    <div className="analytics_activity_metric">
        <p className="analytics_activity_metric_label">{label}</p>
        <p className="analytics_activity_metric_value">{formatNumber(value)}</p>
    </div>
);

const ActivityPanel = ({ activity }) => (
    <section className="analytics_block analytics_activity app-transition">
        <div className="analytics_activity_group">
            <h3 className="analytics_block_title">Посты</h3>
            <div className="analytics_activity_metrics">
                <ActivityMetric label="Написано" value={activity?.posts?.created} />
                <ActivityMetric label="Изменено" value={activity?.posts?.updated} />
                <ActivityMetric label="Удалено" value={activity?.posts?.deleted} />
            </div>
        </div>
        <div className="analytics_activity_group">
            <h3 className="analytics_block_title">Пользователи</h3>
            <div className="analytics_activity_metrics">
                <ActivityMetric label="Новые" value={activity?.users?.registered} />
                <ActivityMetric label="Авторизации" value={activity?.users?.logins} />
            </div>
        </div>
        <div className="analytics_activity_group">
            <h3 className="analytics_block_title">Комментарии</h3>
            <div className="analytics_activity_metrics">
                <ActivityMetric label="Написано" value={activity?.comments?.created} />
                <ActivityMetric label="Изменено" value={activity?.comments?.updated} />
                <ActivityMetric label="Удалено" value={activity?.comments?.deleted} />
            </div>
        </div>
        <div className="analytics_activity_group">
            <h3 className="analytics_block_title">Лайки</h3>
            <div className="analytics_activity_metrics">
                <ActivityMetric label="На посты" value={activity?.likes?.posts} />
            </div>
        </div>
    </section>
);

const AudienceRatio = ({ audience }) => {
    const authorized = Number(audience?.authorized_visits || 0);
    const anonymous = Number(audience?.anonymous_visits || 0);
    const total = authorized + anonymous;
    const authorizedShare = total ? (authorized / total) * 100 : 0;

    return (
        <section className="analytics_block analytics_audience app-transition">
            <div className="analytics_audience_bar">
                {authorizedShare > 0 ? (
                    <div
                        className="analytics_audience_bar_auth app-transition"
                        style={{ width: `${authorizedShare}%` }}
                    />
                ) : null}
            </div>
            <div className="analytics_audience_legend">
                <div className="analytics_audience_item">
                    <span className="analytics_audience_swatch analytics_audience_swatch_auth" />
                    <span>Авторизованные</span>
                    <span className="analytics_audience_count">
                        {formatNumber(authorized)}
                    </span>
                </div>
                <div className="analytics_audience_item">
                    <span className="analytics_audience_swatch analytics_audience_swatch_anon" />
                    <span>Анонимные</span>
                    <span className="analytics_audience_count">
                        {formatNumber(anonymous)}
                    </span>
                </div>
            </div>
        </section>
    );
};

const DashboardPage = () => {
    const { showToast } = useContext(AppContext);
    const [range, setRange] = useState(14);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            const result = await getDashboard(range);

            if (cancelled) {
                return;
            }

            if (!result?.status) {
                showToast({ type: "error", message: result?.message || "Не удалось загрузить аналитику" });
                setData(null);
                setIsLoading(false);
                return;
            }

            setData(result.data);
            setIsLoading(false);
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [range, showToast]);

    const totals = data?.totals || {};
    const series = data?.series || [];
    const isHourlyRange = range === "24h";
    const topPosts = useMemo(
        () =>
            (data?.top_posts || []).map((item) => ({
                key: String(item._id),
                title: item.title,
                count: item.views_count || 0,
                href: `/posts/${item._id}`,
            })),
        [data],
    );
    const topPaths = useMemo(
        () =>
            (data?.top_paths || []).map((item) => ({
                key: item.path,
                path: item.path,
                count: item.visits || 0,
            })),
        [data],
    );
    const topQueries = useMemo(
        () =>
            (data?.top_queries || []).map((item) => ({
                key: item.query,
                query: item.query,
                count: item.count || 0,
            })),
        [data],
    );
    const topCities = useMemo(
        () =>
            (data?.top_cities || []).map((item) => ({
                key: `${item.city}|${item.country || ""}`,
                label: item.country ? `${item.city}, ${item.country}` : item.city,
                count: item.unique_visitors || 0,
                valueLabel: `${item.percent ?? 0}%`,
            })),
        [data],
    );
    const topHashtags = useMemo(
        () =>
            (data?.top_hashtags || []).map((item) => ({
                key: item.tag,
                tag: item.tag,
                count: item.uses || 0,
                href: hashtagSearchPath(item.tag),
                hashtag: true,
            })),
        [data],
    );

    const activeRange = RANGES.find((item) => item.value === range);

    return (
        <div className="analytics">
            <div className="analytics_period_panel">
                <div className="analytics_period_controls">
                    <p className="analytics_period_label">Период</p>
                    <div className="analytics_period_ranges">
                        {RANGES.map((item) => (
                            <ChipButton
                                key={item.value}
                                variant="quiet"
                                isActive={range === item.value}
                                onClick={() => setRange(item.value)}
                            >
                                {item.label}
                            </ChipButton>
                        ))}
                    </div>
                </div>
                <p className="analytics_period_bounds">
                    <span className="analytics_period_bounds_label">Границы</span>
                    {formatRange(range)}
                </p>
            </div>

            {isLoading ? (
                <Loading size={40} />
            ) : (
                <>
                    <AnalyticsScope
                        title="За выбранный период"
                        hint={`Метрики ниже считаются только за ${activeRange?.label?.toLowerCase() || "период"}`}
                        className="analytics_scope_period"
                    >
                        <AnalyticsGroup title="Трафик" hint="Посещения и уникальные посетители по IP">
                            <div className="analytics_traffic">
                                <div className="analytics_traffic_stats">
                                    <StatCard
                                        label="Посещения"
                                        value={totals.visits}
                                        previous={totals.visits_prev}
                                    />
                                    <StatCard
                                        label="Уникальные посетители"
                                        value={totals.unique_visitors}
                                        previous={totals.unique_visitors_prev}
                                        hint="по IP"
                                    />
                                </div>
                                <section className="analytics_block analytics_block_chart app-transition">
                                    {series.length ? (
                                        <TrendChart
                                            series={series}
                                            keys={TRAFFIC_KEYS}
                                            hourly={isHourlyRange}
                                        />
                                    ) : (
                                        <p className="analytics_empty">Нет посещений за период</p>
                                    )}
                                </section>
                            </div>
                        </AnalyticsGroup>

                        <AnalyticsGroup title="Активность" hint="Посты, пользователи, комментарии и лайки">
                            <ActivityPanel activity={data?.activity} />
                        </AnalyticsGroup>

                        <AnalyticsGroup
                            title="Аудитория"
                            hint="Авторизованные и анонимные просмотры страниц"
                        >
                            <AudienceRatio audience={data?.audience} />
                        </AnalyticsGroup>

                        <AnalyticsGroup
                            title="Города"
                            hint="Доля уникальных посетителей по IP"
                        >
                            <section className="analytics_block app-transition">
                                <RankedBars
                                    items={topCities}
                                    wideLabel
                                    empty="Нет городов за период"
                                />
                            </section>
                        </AnalyticsGroup>

                        <div className="analytics_grid">
                            <AnalyticsGroup title="Популярные страницы" hint="Топ-5 по просмотрам">
                                <section className="analytics_block app-transition">
                                    <RankedBars
                                        items={topPaths}
                                        wideLabel
                                        empty="Нет просмотров страниц за период"
                                    />
                                </section>
                            </AnalyticsGroup>

                            <AnalyticsGroup title="Поиск" hint="Топ-5 запросов">
                                <section className="analytics_block app-transition">
                                    <RankedBars
                                        items={topQueries}
                                        wideLabel
                                        empty="Пока нет поисковых запросов"
                                    />
                                </section>
                            </AnalyticsGroup>
                        </div>
                    </AnalyticsScope>

                    <AnalyticsScope
                        title="Общая статистика"
                        hint="Не зависит от выбранного периода"
                        className="analytics_scope_overall"
                    >
                        <div className="analytics_grid">
                            <AnalyticsGroup title="Топ постов" hint="Суммарные просмотры постов">
                                <section className="analytics_block app-transition">
                                    <RankedBars
                                        items={topPosts}
                                        wideLabel
                                        empty="Пока нет просмотров постов"
                                    />
                                </section>
                            </AnalyticsGroup>

                            <AnalyticsGroup title="Теги" hint="По всему контенту на сайте">
                                <section className="analytics_block app-transition">
                                    <RankedBars
                                        items={topHashtags}
                                        wideLabel
                                        empty="В контенте пока нет тегов"
                                    />
                                </section>
                            </AnalyticsGroup>
                        </div>
                    </AnalyticsScope>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
