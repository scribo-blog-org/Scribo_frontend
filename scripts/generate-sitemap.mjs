import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(rootDir, "public");
const outputPath = path.join(publicDir, "sitemap.xml");
const robotsPath = path.join(publicDir, "robots.txt");
const envPath = path.join(rootDir, ".env");

try {
    const envContent = await readFile(envPath, "utf8");

    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const separator = trimmed.indexOf("=");

        if (separator === -1) {
            continue;
        }

        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim();

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
} catch {
    // .env is optional — CI/Vercel can inject variables directly
}

const siteHost =
    process.env.VITE_APP_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.SITE_URL ||
    "scribo-blog.vercel.app";

const siteOrigin = siteHost.startsWith("http")
    ? siteHost.replace(/\/$/, "")
    : `${siteHost.startsWith("localhost") ? "http" : "https"}://${siteHost.replace(/\/$/, "")}`;

const apiUrl = (process.env.VITE_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");

const STATIC_ROUTES = [
    { loc: "/posts", changefreq: "daily", priority: "1.0" },
    { loc: "/search", changefreq: "weekly", priority: "0.6" },
    { loc: "/support", changefreq: "monthly", priority: "0.4" },
    { loc: "/api", changefreq: "monthly", priority: "0.3" },
];

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function toIsoDate(value) {
    if (!value) {
        return new Date().toISOString();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
    return [
        "  <url>",
        `    <loc>${escapeXml(`${siteOrigin}${loc}`)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
        priority ? `    <priority>${priority}</priority>` : "",
        "  </url>",
    ]
        .filter(Boolean)
        .join("\n");
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.json();
}

async function fetchAllPosts() {
    const items = [];
    let page = 1;
    let pages = 1;

    while (page <= pages) {
        const result = await fetchJson(
            `${apiUrl}/api/posts?expand=author&page=${page}&limit=100`,
        );

        if (!result?.status) {
            break;
        }

        const payload = result.data;
        const pageItems = Array.isArray(payload) ? payload : payload?.items || [];

        items.push(...pageItems);
        pages = payload?.pagination?.pages || 1;
        page += 1;
    }

    return items;
}

async function fetchAllUsers() {
    const result = await fetchJson(`${apiUrl}/api/users/?limit=500`);

    if (!result?.status) {
        return [];
    }

    return Array.isArray(result.data) ? result.data : [];
}

async function main() {
    const urls = STATIC_ROUTES.map((route) =>
        urlEntry({
            ...route,
            lastmod: new Date().toISOString(),
        }),
    );

    try {
        const posts = await fetchAllPosts();

        for (const post of posts) {
            if (!post?._id) {
                continue;
            }

            urls.push(
                urlEntry({
                    loc: `/posts/${post._id}`,
                    lastmod: toIsoDate(post.updated_date || post.created_date),
                    changefreq: "weekly",
                    priority: "0.8",
                }),
            );
        }
    } catch (error) {
        console.warn("[sitemap] posts skipped:", error.message);
    }

    try {
        const users = await fetchAllUsers();

        for (const user of users) {
            if (!user?.nick_name) {
                continue;
            }

            urls.push(
                urlEntry({
                    loc: `/users/${encodeURIComponent(user.nick_name)}`,
                    lastmod: toIsoDate(user.updated_date || user.created_date),
                    changefreq: "weekly",
                    priority: "0.5",
                }),
            );
        }
    } catch (error) {
        console.warn("[sitemap] users skipped:", error.message);
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        "</urlset>",
        "",
    ].join("\n");

    await mkdir(publicDir, { recursive: true });
    await writeFile(outputPath, xml, "utf8");

    const robots = [
        "# https://www.robotstxt.org/robotstxt.html",
        "User-agent: *",
        "Allow: /",
        "",
        "Disallow: /admin-panel",
        "Disallow: /settings",
        "Disallow: /messages",
        "Disallow: /notifications",
        "Disallow: /create-post",
        "Disallow: /posts/*/edit",
        "Disallow: /support/mine",
        "Disallow: /support/",
        "Allow: /support$",
        "Disallow: /auth/",
        "",
        `Sitemap: ${siteOrigin}/sitemap.xml`,
        "",
    ].join("\n");

    await writeFile(robotsPath, robots, "utf8");

    console.log(`[sitemap] wrote ${urls.length} urls to ${outputPath}`);
    console.log(`[sitemap] updated ${robotsPath}`);
}

main().catch((error) => {
    console.error("[sitemap] failed:", error);
    process.exitCode = 1;
});
