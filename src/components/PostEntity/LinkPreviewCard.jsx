const LinkPreviewCard = ({ preview, className = "", onMediaLoad }) => {
    if (!preview?.url) {
        return null;
    }

    const title = preview.title || preview.url;
    let site = preview.site_name;

    if (!site) {
        try {
            site = new URL(preview.url).hostname;
        } catch {
            site = preview.url;
        }
    }

    return (
        <a
            href={preview.url}
            className={`link_preview_card app-transition ${className}`.trim()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
        >
            {preview.image ? (
                <div className="link_preview_card_media">
                    <img
                        src={preview.image}
                        alt=""
                        loading="lazy"
                        onLoad={onMediaLoad}
                    />
                </div>
            ) : null}
            <div className="link_preview_card_body">
                <span className="link_preview_card_site">{site}</span>
                <span className="link_preview_card_title">{title}</span>
                {preview.description ? (
                    <span className="link_preview_card_excerpt">
                        {preview.description}
                    </span>
                ) : null}
            </div>
        </a>
    );
};

export default LinkPreviewCard;
