/**
 * Platform (Robin Labs) identity used in server-generated content such as
 * emails. Mirrors apps/frontend/lib/theme/platform.ts. Organization branding
 * never changes these values.
 */
export const PLATFORM = {
    platformName: "Robin Labs",
    productName: process.env.PRODUCT_NAME?.trim() || "Robin Talent",
    /** Robin Labs terracotta (Warm Professional primary); 6.7:1 with white text. */
    brandColor: "#A8320C",
} as const;

/** Escapes text for safe interpolation into HTML email templates. */
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
