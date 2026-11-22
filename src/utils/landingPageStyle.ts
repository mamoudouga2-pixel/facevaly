type LandingSectionStyle = {
    max_width?: number | string;
    background?: string;
    text_color?: string;
    padding_y?: number | string;
    padding_x?: number | string;
    align?: string;
    border_radius?: number | string;
    accent?: string;
    [key: string]: unknown;
};

export function sectionShellStyle(
    style: LandingSectionStyle = {}
): Record<string, string | undefined> {
    const maxWidth = Number(style.max_width || 960);

    return {
        background: style.background || undefined,
        color: style.text_color || undefined,
        paddingTop: `${Number(style.padding_y ?? 48)}px`,
        paddingBottom: `${Number(style.padding_y ?? 48)}px`,
        paddingLeft: `${Number(style.padding_x ?? 24)}px`,
        paddingRight: `${Number(style.padding_x ?? 24)}px`,
        textAlign: style.align || "left",
        borderRadius: `${Number(style.border_radius || 0)}px`,
        ["--flp-max"]: `${maxWidth}px`,
        ["--flp-accent"]: style.accent || undefined,
    };
}
