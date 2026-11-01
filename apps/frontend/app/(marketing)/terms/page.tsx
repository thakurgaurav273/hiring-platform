import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/legal-page";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";

const { productName, legal } = PLATFORM_BRANDING;
const company = legal.entityName;

export const metadata: Metadata = {
  title: `Terms of Service · ${productName}`,
  description: `The terms that govern use of ${productName}, provided by ${company}.`,
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "About these terms",
    body: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern access to and use of {productName} (the &quot;Service&quot;), an
          applicant tracking platform provided by {company} (&quot;{company}&quot;, &quot;we&quot;, &quot;us&quot;).
        </p>
        <p>
          The Service is provided to organizations (each a &quot;Customer&quot;) and to the people a Customer invites to its
          workspace (&quot;Users&quot;). If a Customer has signed a separate agreement with {company}, that agreement takes
          precedence over these Terms where they conflict.
        </p>
        <p>
          By signing in or using the Service you agree to these Terms. If you use the Service on behalf of an organization,
          you confirm that you are authorized to accept these Terms for it.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and access",
    body: (
      <>
        <p>
          Accounts are created by invitation from a Customer&apos;s administrator. Each User is assigned a role
          (administrator, recruiter, hiring manager or employee) that determines what they can see and do.
        </p>
        <ul>
          <li>Keep your password confidential and do not share your account.</li>
          <li>Tell your administrator promptly if you suspect unauthorized access to your account.</li>
          <li>
            Customers are responsible for who they invite, the roles they assign, and removing access for people who no
            longer need it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "customer-data",
    title: "Customer data",
    body: (
      <>
        <p>
          &quot;Customer Data&quot; means the information Users put into the Service, such as job descriptions, candidate
          profiles, résumés, interview feedback, notes, emails and branding assets. The Customer owns its Customer Data.
        </p>
        <p>
          The Customer grants {company} permission to host, process and display Customer Data only as needed to provide,
          secure and support the Service. We do not sell Customer Data. How personal data is handled is described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          The Customer is responsible for having a lawful basis to collect and process the candidate and employee data it
          puts into the Service, including any notices or consents required by law, and for using the Service in line with
          applicable employment and anti-discrimination laws.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for anything unlawful, or to discriminate unlawfully against candidates or employees;</li>
          <li>upload malware, or content you do not have the right to share;</li>
          <li>attempt to access another organization&apos;s data, or bypass permissions, rate limits or other security controls;</li>
          <li>probe, scan or load-test the Service without our written permission;</li>
          <li>send unsolicited bulk email or spam through the Service;</li>
          <li>resell, sublicense or provide the Service to third parties except as agreed with {company}.</li>
        </ul>
        <p>We may suspend access that we reasonably believe breaks these rules or puts the Service or other Customers at risk.</p>
      </>
    ),
  },
  {
    id: "branding",
    title: "Branding",
    body: (
      <>
        <p>
          Customers may brand their workspace with their own name, logo, favicon and colours. The Customer confirms it has the
          right to use any branding it uploads.
        </p>
        <p>
          {productName}, {company} and their logos are trademarks of {company}. The Service may show platform attribution such
          as &quot;Powered by {company}&quot;, which Customers may not remove except as agreed in writing.
        </p>
      </>
    ),
  },
  {
    id: "our-ip",
    title: "Our intellectual property",
    body: (
      <p>
        {company} owns the Service, including its software, design and documentation. Apart from the right to use the
        Service under these Terms, no rights are transferred to you. If you send us feedback or suggestions, we may use them
        without obligation to you.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "Third-party services",
    body: (
      <p>
        The Service relies on third-party providers, for example for hosting, file storage, email delivery and browser push
        notifications. Their availability is outside our direct control, though we choose them carefully and remain
        responsible for how we use them to provide the Service.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep the Service available and secure, but it may occasionally be unavailable for maintenance or reasons
        beyond our control. We may improve or change features over time. If we make a change that materially reduces the
        Service for Customers, we will give reasonable notice where practical.
      </p>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <p>
        Fees, billing terms and the subscription period, if any, are set out in the Customer&apos;s order or agreement with{" "}
        {company}. These Terms do not by themselves create any payment obligation.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          A Customer may stop using the Service as set out in its agreement. Administrators can deactivate individual Users at
          any time. We may suspend or end access for a material breach of these Terms that is not fixed within a reasonable
          time, or immediately where needed to prevent harm.
        </p>
        <p>
          When a Customer&apos;s use of the Service ends, the Customer may request an export of its Customer Data within a
          reasonable period, after which we will delete it in line with our retention practices, unless the law requires us to
          keep it.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        Except as expressly stated in a Customer&apos;s agreement, the Service is provided &quot;as is&quot; and &quot;as
        available&quot;. To the extent permitted by law, {company} disclaims implied warranties, including merchantability,
        fitness for a particular purpose and non-infringement. Hiring decisions are made by the Customer; the Service is a tool
        to support them.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent permitted by law, {company} is not liable for indirect, incidental, special or consequential damages, or
        for lost profits, revenue or data, arising from use of the Service. Our total liability for any claim relating to the
        Service is limited to the amounts the Customer paid for the Service in the twelve months before the claim. Nothing in
        these Terms limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. We will change the &quot;Last updated&quot; date above and, for material
        changes, notify Customers in advance through the Service or by email. Continuing to use the Service after changes take
        effect means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <p>
        These Terms are governed by the laws specified in the Customer&apos;s agreement with {company} or, if none is
        specified, the laws of the place where {company} is established. If any part of these Terms is found unenforceable, the
        rest remains in effect. Failing to enforce a provision is not a waiver of it.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these Terms can be sent to <LegalContact />.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      summary={
        <p>
          In short: your organization owns its data and controls who has access. You agree to use {productName} lawfully and
          not to interfere with other organizations or the platform. {company} provides and secures the Service and does not
          sell your data.
        </p>
      }
      sections={sections}
    />
  );
}
