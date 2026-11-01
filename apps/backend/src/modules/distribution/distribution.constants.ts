import { PublicationChannel } from "@prisma/client";

export type ChannelKind = "first_party" | "external";

export interface ChannelDefinition {
    channel: PublicationChannel;
    label: string;
    kind: ChannelKind;
    /**
     * True when Robin Talent can publish to this destination itself. External
     * job boards stay false until an approved partner/API integration exists:
     * no request to these boards is made and no success is ever recorded.
     */
    directPublishing: boolean;
    /** What to do when direct publishing is not available. */
    manualHint?: string;
    /** utm_source added to tracked share links for this destination. */
    utmSource?: string;
}

export const CHANNELS: ChannelDefinition[] = [
    { channel: "CAREERS_PAGE", label: "Careers page", kind: "first_party", directPublishing: true },
    { channel: "WEBSITE_EMBED", label: "Company website (embed)", kind: "first_party", directPublishing: true },
    {
        channel: "LINKEDIN",
        label: "LinkedIn",
        kind: "external",
        directPublishing: false,
        utmSource: "linkedin",
        manualHint:
            "Direct posting needs LinkedIn's Job Posting API (partner access). Share the tracked link in a LinkedIn post or paste it as the apply URL when posting the job on LinkedIn.",
    },
    {
        channel: "INDEED",
        label: "Indeed",
        kind: "external",
        directPublishing: false,
        utmSource: "indeed",
        manualHint:
            "Direct posting needs an Indeed partner integration or XML feed agreement. Post the job on Indeed and use the tracked link as the application URL.",
    },
    {
        channel: "NAUKRI",
        label: "Naukri",
        kind: "external",
        directPublishing: false,
        utmSource: "naukri",
        manualHint:
            "Direct posting needs a Naukri RMS/partner integration. Post the job on Naukri and use the tracked link as the application URL.",
    },
];

export const channelDefinition = (channel: PublicationChannel) => CHANNELS.find((c) => c.channel === channel)!;

/** Maps utm_source values from tracked links to application sources. */
export const UTM_SOURCE_MAP: Record<string, "LINKEDIN" | "INDEED" | "NAUKRI" | "COMPANY_WEBSITE"> = {
    linkedin: "LINKEDIN",
    indeed: "INDEED",
    naukri: "NAUKRI",
    website: "COMPANY_WEBSITE",
    embed: "COMPANY_WEBSITE",
};

/** Version of the privacy notice applicants consent to. Bump when the text changes. */
export const APPLICATION_CONSENT_VERSION = "2026-11-01";
