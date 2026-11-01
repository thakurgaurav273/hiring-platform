import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/legal-page";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";

const { productName, legal } = PLATFORM_BRANDING;
const company = legal.entityName;

export const metadata: Metadata = {
  title: `Privacy Policy · ${productName}`,
  description: `How ${company} collects, uses and protects personal data in ${productName}.`,
};

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Who this policy covers",
    body: (
      <>
        <p>
          This policy explains how personal data is handled in {productName} (the &quot;Service&quot;), provided by {company}.
          It applies to:
        </p>
        <ul>
          <li>
            <strong>Users</strong>: people invited to an organization&apos;s workspace, such as recruiters, hiring managers and
            employees;
          </li>
          <li>
            <strong>Candidates</strong>: people whose details an organization records while hiring;
          </li>
          <li>
            <strong>Visitors</strong> to this website.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "roles",
    title: "Our role and the organization's role",
    body: (
      <>
        <p>
          For data inside a workspace, the organization using the Service (the &quot;Customer&quot;) decides what is collected
          and why. The Customer is the <strong>controller</strong> and {company} acts as its <strong>processor</strong>,
          handling the data only on the Customer&apos;s instructions to provide the Service.
        </p>
        <p>
          If you are a candidate or employee with a question about your data, please contact the organization you applied to or
          work for first. We will support them in responding.
        </p>
        <p>{company} is the controller for account security data and for information about visitors to this website.</p>
      </>
    ),
  },
  {
    id: "data",
    title: "Personal data we process",
    body: (
      <>
        <p>
          <strong>User accounts:</strong> name, work email, role, department, title, phone and address if provided, profile
          photo, notification preferences, appearance preferences, and a hashed password (we never store passwords in plain
          text).
        </p>
        <p>
          <strong>Candidate records</strong> entered by the Customer: name, email, phone, location, skills, experience,
          education, profile links, résumés and other uploaded files, source and referral details, applications and pipeline
          stage, interview schedules, notes, interview feedback and emails exchanged through the Service.
        </p>
        <p>
          <strong>Activity and security data:</strong> records of actions taken in a workspace (for example stage changes or
          role changes) with the User who performed them, sign-in sessions, and technical request data such as IP address that
          our servers use for rate limiting and security logs.
        </p>
        <p>
          <strong>Notification data:</strong> if you allow browser notifications, a device token so we can deliver push
          notifications to that browser.
        </p>
        <p>
          <strong>Organization branding:</strong> organization name, logo, favicon and theme settings. These are usually not
          personal data.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>to provide the Service: manage jobs, candidates, interviews, referrals, email and reports for the Customer;</li>
        <li>to send service emails such as invitations, password resets and notifications you have not turned off;</li>
        <li>to keep the Service secure, including authentication, permission checks, abuse prevention and audit logs;</li>
        <li>to support Customers and fix problems;</li>
        <li>to meet legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "no-sale",
    title: "What we don't do",
    body: (
      <ul>
        <li>We do not sell personal data or share it for advertising.</li>
        <li>We do not use advertising or cross-site tracking technologies in the Service.</li>
        <li>We do not use Customer Data to make automated hiring decisions; decisions are made by the Customer&apos;s people.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          Within a workspace, data is visible to that organization&apos;s Users according to their role. Each organization&apos;s
          data is kept separate from every other organization&apos;s.
        </p>
        <p>
          We use service providers (sub-processors) to run the Service, under contracts that require them to protect the data
          and use it only for us. Depending on how a deployment is configured, these include providers of:
        </p>
        <ul>
          <li>cloud hosting and databases;</li>
          <li>file storage for résumés, attachments and logos;</li>
          <li>email delivery;</li>
          <li>browser push notifications (Google Firebase Cloud Messaging).</li>
        </ul>
        <p>
          A current list of sub-processors is available to Customers on request. We may also disclose data where the law
          requires it, or to protect the rights and safety of Users, Customers or the public.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <ul>
        <li>Organization membership and permissions are checked on the server for every request.</li>
        <li>Accounts are invitation-only and passwords are hashed with bcrypt.</li>
        <li>Sessions use signed tokens that expire, and sessions are revoked when a User is deactivated.</li>
        <li>Uploads are checked by type, size and actual file content, and stored under server-generated names.</li>
        <li>Requests are rate limited to reduce abuse.</li>
      </ul>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        Customer Data is kept for as long as the Customer uses the Service, or until the Customer deletes it. Customers are
        responsible for setting how long they keep candidate data in line with the law that applies to them. When a
        Customer&apos;s use of the Service ends, we delete its data within a reasonable period after any export, unless we must
        keep it by law. Security logs are kept only as long as needed for security purposes.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Our service providers may process data in countries other than yours. Where the law requires it, we put appropriate
        safeguards in place for those transfers, such as standard contractual clauses.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have rights to access, correct, delete or export your personal data, to object to
          or restrict certain processing, and to complain to a data protection authority.
        </p>
        <p>
          Users can update much of their own profile and preferences in Settings. For data held in a workspace, contact the
          organization concerned; we will help them respond. For data we control, contact us using the details below.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        The Service uses only storage that is needed for it to work, such as keeping you signed in and remembering your theme.
        See our <Link href="/cookies">Cookie Policy</Link> for details.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>The Service is intended for use by organizations and their staff. It is not directed at children.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We will update the &quot;Last updated&quot; date when this policy changes and tell Customers about material changes in
        advance.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        For privacy questions or requests, contact <LegalContact />.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      summary={
        <p>
          In short: organizations using {productName} control the candidate and employee data in their workspace, and{" "}
          {company} processes it on their behalf to run the Service. We don&apos;t sell personal data, we don&apos;t use
          advertising trackers, and each organization&apos;s data is kept separate.
        </p>
      }
      sections={sections}
    />
  );
}
