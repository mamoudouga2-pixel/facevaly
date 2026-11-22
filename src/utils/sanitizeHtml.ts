import DOMPurify from "dompurify";

/*
 * Product descriptions and video embeds are authored by sellers, so they are
 * untrusted input. Everything that reaches dangerouslySetInnerHTML must pass
 * through here first.
 */

const RICH_TEXT_CONFIG: Record<string, unknown> = {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["style", "srcdoc", "formaction", "form"],
};

/*
 * Sellers paste YouTube/Vimeo iframes for product videos, so iframes are kept
 * for embeds only, restricted to known video hosts.
 */
const EMBED_CONFIG: Record<string, unknown> = {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "title"],
    FORBID_ATTR: ["srcdoc", "formaction", "form"],
};

const ALLOWED_EMBED_HOSTS = [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
    "youtu.be",
    "player.vimeo.com",
    "vimeo.com",
    "www.facebook.com",
    "web.facebook.com",
    "www.dailymotion.com",
];

let embedHookRegistered = false;

const registerEmbedHook = (): void => {
    if (embedHookRegistered || typeof DOMPurify.addHook !== "function") {
        return;
    }

    DOMPurify.addHook("uponSanitizeElement", (node: any, data: any) => {
        if (data.tagName !== "iframe") {
            return;
        }

        const src = node.getAttribute?.("src") || "";

        let allowed = false;

        try {
            allowed = ALLOWED_EMBED_HOSTS.includes(
                new URL(src, window.location.origin).hostname
            );
        } catch {
            allowed = false;
        }

        if (!allowed) {
            node.remove();
        }
    });

    embedHookRegistered = true;
};

export const sanitizeRichText = (html: unknown): string => {
    if (!html) {
        return "";
    }

    return DOMPurify.sanitize(String(html), RICH_TEXT_CONFIG as any);
};

export const sanitizeEmbed = (html: unknown): string => {
    if (!html) {
        return "";
    }

    registerEmbedHook();

    return DOMPurify.sanitize(String(html), EMBED_CONFIG as any);
};

export default sanitizeRichText;
