import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/legal-page";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { THEME_STORAGE_KEY } from "@/lib/theme/runtime";

const { productName, legal } = PLATFORM_BRANDING;

export const metadata: Metadata = {
  title: `Cookie Policy · ${productName}`,
  description: `The cookies and browser storage ${productName} uses, and why.`,
};

// Keep in sync with the keys the app writes (store/app.store.ts, lib/theme/runtime.ts).
const STORAGE = [
  {
    name: "grovyn-auth-storage",
    type: "Local storage",
    purpose: "Keeps you signed in and remembers your workspace, role and branding between visits.",
    duration: "Until you sign out or clear site data",
  },
  {
    name: THEME_STORAGE_KEY,
    type: "Local storage",
    purpose: "Remembers your organization's theme and your light/dark choice so pages load without flashing the wrong colours.",
    duration: "Until you clear site data",
  },
  {
    name: "Firebase Cloud Messaging",
    type: "Service worker and IndexedDB",
    purpose: "Only if you allow browser notifications: stores the token used to deliver push notifications to this browser.",
    duration: "Until you revoke notification permission or clear site data",
  },
];

const sections: LegalSection[] = [
  {
    id: "summary",
    title: "What we use",
    body: (
      <>
        <p>
          {productName} uses a small amount of browser storage that is strictly necessary for the Service to work. We do not use
          advertising, analytics or cross-site tracking cookies, and fonts are served from our own servers rather than third-party
          font services.
        </p>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead className="bg-surface-2 text-[12.5px] text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Name</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Type</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Purpose</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {STORAGE.map((s) => (
                <tr key={s.name} className="align-top">
                  <td className="px-4 py-3 font-mono text-[12.5px]">{s.name}</td>
                  <td className="px-4 py-3">{s.type}</td>
                  <td className="px-4 py-3">{s.purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "consent",
    title: "Why there is no cookie banner",
    body: (
      <p>
        Because this storage is strictly necessary to provide the Service you have asked for, it does not require consent under
        most cookie laws. Push notifications are only enabled after you grant permission in your browser. If we ever add
        optional cookies, such as analytics, we will ask for your consent first and update this page.
      </p>
    ),
  },
  {
    id: "control",
    title: "How to control it",
    body: (
      <ul>
        <li>Signing out removes your session from this browser.</li>
        <li>You can clear site data or block storage in your browser settings; the Service will not work while you are signed in without it.</li>
        <li>You can turn off push notifications at any time in your browser&apos;s site settings.</li>
      </ul>
    ),
  },
  {
    id: "more",
    title: "More information",
    body: (
      <p>
        See our <Link href="/privacy">Privacy Policy</Link> for how personal data is handled, or contact <LegalContact /> with
        questions.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      path="/cookies"
      summary={
        <p>
          In short: {productName} only uses browser storage it needs to work (keeping you signed in and remembering your theme).
          No advertising or analytics trackers. {legal.entityName} keeps this list up to date.
        </p>
      }
      sections={sections}
    />
  );
}
