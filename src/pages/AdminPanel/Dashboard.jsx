import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppContext } from "../../App";
import { getDashboard } from "../../api/analytics.api";
import { hashtagSearchPath } from "../../utils/hashtags";

import ChipButton from "../../components/Ui/ChipButton";
import Loading from "../../components/Ui/Loading";

import "./Dashboard.scss";

const RANGES = [7, 14, 30];

const TRAFFIC_KEYS = [
    { key: "visitors", label: "Посетители", color: "var(--text-color)" },
];

const formatDay = (iso) => {
    const date = new Date(`${iso}T00:00:00Z`);
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
    });
};

const formatRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
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

    if (prev < 10) {
        return {
            text: `${abs > 0 ? "+" : ""}${formatNumber(abs)} к прошлому периоду`,
            tone: abs > 0 ? "up" : "down",
        };
    }

    const pct = Math.round((abs / prev) * 100);
    return {
        text: `${pct > 0 ? "+" : ""}${pct}% к прошлому периоду`,
        tone: pct > 0 ? "up" : "down",
    };
};

const TrendChart = ({ series, keys }) => {
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
                            {formatDay(point.date)}
                        </text>
                    );
                })}
            </svg>
            {active && cursor ? (
                <div className="analytics_chart_tooltip" style={tooltipStyle}>
                    <p>{formatDay(active.date)}</p>
                    {keys.map((item) => (
                        <p key={item.key}>
                            {item.label}: {formatNumber(active[item.key])}
                        </p>
                    ))}
                </div>
            ) : null}
            <div className="analytics_legend">
                {keys.map((item) => (
                    <span className="analytics_legend_item" key={item.key}>
                        <span className="analytics_legend_swatch" style={{ background: item.color }} />
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

const RankedBars = ({ items, empty, wideLabel, showPercent = true }) => {
    const maxValue = Math.max(1, ...items.map((item) => item.count || item.visits || 0));

    if (!items.length) {
        return <p className="analytics_empty">{empty || "Нет данных за период"}</p>;
    }

    return (
        <div className={`analytics_bars${wideLabel ? " analytics_bars_wide" : ""}`}>
            {items.map((item) => {
                const label = item.label || item.type || item.path || item.query || item.tag || item.title;
                const value = item.count ?? item.visits ?? item.views_count ?? 0;
                const note = item.note
                    || (showPercent && item.percent != null ? `${item.percent}%` : null)
                    || (item.uses != null ? `${formatNumber(item.uses)} исп.` : null);

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
                            {formatNumber(value)}
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
    const authorized = Number(audience?.authorized_percent || 0);
    const anonymous = Number(audience?.anonymous_percent || 0);

    return (
        <section className="analytics_block analytics_audience app-transition">
            <div className="analytics_audience_bar">
                {authorized > 0 ? (
                    <div
                        className="analytics_audience_bar_auth app-transition"
                        style={{ width: `${authorized}%` }}
                    />
                ) : null}
            </div>
            <div className="analytics_audience_legend">
                <div className="analytics_audience_item">
                    <span className="analytics_audience_swatch analytics_audience_swatch_auth" />
                    <span>Авторизованные</span>
                    <strong>{authorized}%</strong>
                    <span className="analytics_audience_count">
                        {formatNumber(audience?.authorized_visits)}
                    </span>
                </div>
                <div className="analytics_audience_item">
                    <span className="analytics_audience_swatch analytics_audience_swatch_anon" />
                    <span>Анонимные</span>
                    <strong>{anonymous}%</strong>
                    <span className="analytics_audience_count">
                        {formatNumber(audience?.anonymous_visits)}
                    </span>
                </div>
            </div>
        </section>
    );
};

const DashboardPage = () => {
    const { showToast } = useContext(AppContext);
    const [days, setDays] = useState(14);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            const result = await getDashboard(days);

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
    }, [days, showToast]);

    const totals = data?.totals || {};
    const series = data?.series || [];
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
                percent: item.percent,
            })),
        [data],
    );
    const topQueries = useMemo(
        () =>
            (data?.top_queries || []).map((item) => ({
                key: item.query,
                query: item.query,
                count: item.count || 0,
                percent: item.percent,
            })),
        [data],
    );
    const topHashtags = useMemo(
        () =>
            (data?.top_hashtags || []).map((item) => ({
                key: item.tag,
                tag: item.tag,
                count: item.uses || 0,
                percent: item.percent,
                uses: item.uses,
                href: hashtagSearchPath(item.tag),
                hashtag: true,
            })),
        [data],
    );

    return (
        <div className="analytics">
            <div className="analytics_toolbar">
                <div className="analytics_toolbar_ranges">
                    {RANGES.map((range) => (
                        <ChipButton
                            key={range}
                            variant="quiet"
                            isActive={days === range}
                            onClick={() => setDays(range)}
                        >
                            {range} дней
                        </ChipButton>
                    ))}
                </div>
                <p className="analytics_toolbar_hint">{formatRange(days)}</p>
            </div>

            {isLoading ? (
                <Loading size={40} />
            ) : (
                <>
                    <AnalyticsGroup title="Трафик" hint="Уникальные посетители за выбранный период">
                        <div className="analytics_traffic">
                            <StatCard
                                label="Посетители"
                                value={totals.unique_visitors}
                                previous={totals.unique_visitors_prev}
                            />
                            <section className="analytics_block analytics_block_chart app-transition">
                                {series.length ? (
                                    <TrendChart series={series} keys={TRAFFIC_KEYS} />
                                ) : (
                                    <p className="analytics_empty">Нет посещений за период</p>
                                )}
                            </section>
                        </div>
                    </AnalyticsGroup>

                    <AnalyticsGroup title="Активность" hint="События за выбранный период">
                        <ActivityPanel activity={data?.activity} />
                    </AnalyticsGroup>

                    <AnalyticsGroup title="Аудитория" hint="Доля авторизованных и анонимных просмотров страниц">
                        <AudienceRatio audience={data?.audience} />
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

                        <AnalyticsGroup title="Топ постов" hint="По просмотрам">
                            <section className="analytics_block app-transition">
                                <RankedBars
                                    items={topPosts}
                                    wideLabel
                                    showPercent={false}
                                    empty="Пока нет просмотров постов"
                                />
                            </section>
                        </AnalyticsGroup>
                    </div>

                    <div className="analytics_grid">
                        <AnalyticsGroup title="Поиск" hint="Топ-5 запросов в процентах">
                            <section className="analytics_block app-transition">
                                <RankedBars
                                    items={topQueries}
                                    wideLabel
                                    empty="Пока нет поисковых запросов"
                                />
                            </section>
                        </AnalyticsGroup>

                        <AnalyticsGroup title="Теги" hint="Топ-5 по использованию">
                            <section className="analytics_block app-transition">
                                <RankedBars
                                    items={topHashtags}
                                    wideLabel
                                    empty="В контенте пока нет тегов"
                                />
                            </section>
                        </AnalyticsGroup>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
