/** Presets for rich text fields — opt in per screen, not in plain InputField. */
export const COMPOSER_PRESETS = {
    plain: { hashtags: false, mentions: false },
    hashtags: { hashtags: true, mentions: false },
    social: { hashtags: true, mentions: true },
};

export function resolveComposerFeatures(preset, features) {
    if (features) {
        return {
            hashtags: Boolean(features.hashtags),
            mentions: Boolean(features.mentions),
        };
    }

    return { ...(COMPOSER_PRESETS[preset] || COMPOSER_PRESETS.plain) };
}
