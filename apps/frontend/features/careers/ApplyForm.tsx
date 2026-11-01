"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { CircleAlert, CircleCheck, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { API_URL, type ApplicationQuestion, type PublicJob } from "@/lib/careers";

const RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_RESUME = 5 * 1024 * 1024;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function QuestionField({ q }: { q: ApplicationQuestion }) {
  const id = `q-${q.id}`;
  if (q.type === "long_text") {
    return (
      <Field id={id} label={q.label} required={q.required}>
        <textarea id={id} name={`answer:${q.id}`} required={q.required} maxLength={5000} rows={4} className="input" />
      </Field>
    );
  }
  if (q.type === "short_text") {
    return (
      <Field id={id} label={q.label} required={q.required}>
        <input id={id} name={`answer:${q.id}`} required={q.required} maxLength={300} className="input" />
      </Field>
    );
  }
  const options = q.type === "yes_no" ? ["Yes", "No"] : q.options ?? [];
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium">
        {q.label}
        {q.required ? <span className="text-destructive"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-[13.5px] has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input type="radio" name={`answer:${q.id}`} value={o} required={q.required} className="accent-[var(--color-primary)]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Public application form. Candidates don't need an account. */
export function ApplyForm({
  orgSlug,
  orgName,
  job,
  consentVersion,
  channel,
}: {
  orgSlug: string;
  orgName: string;
  job: PublicJob;
  consentVersion: string;
  channel?: "embed";
}) {
  const [resume, setResume] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "submitting" | "done" | "error"; message?: string }>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  const pickResume = (file: File | undefined) => {
    if (!file) return;
    if (!RESUME_TYPES.includes(file.type)) {
      setState({ status: "error", message: "Please upload your résumé as a PDF, DOC or DOCX file." });
      return;
    }
    if (file.size > MAX_RESUME) {
      setState({ status: "error", message: "Your résumé must be 5 MB or smaller." });
      return;
    }
    setState({ status: "idle" });
    setResume(file);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) {
      setState({ status: "error", message: "Please accept the privacy notice to apply." });
      return;
    }
    const form = new FormData(e.currentTarget);
    const body = new FormData();
    const answers: Record<string, string> = {};
    for (const [k, v] of form.entries()) {
      if (typeof v !== "string") continue;
      if (k.startsWith("answer:")) answers[k.slice(7)] = v;
      else body.append(k, v);
    }
    body.set("answers", JSON.stringify(answers));
    body.set("consent", "true");
    body.set("consentVersion", consentVersion);
    if (channel) body.set("channel", channel);
    // Attribution from the link the candidate arrived on.
    const url = new URL(window.location.href);
    for (const key of UTM_KEYS) {
      const v = url.searchParams.get(key);
      if (v) body.set(key, v);
    }
    if (document.referrer) body.set("referrerUrl", document.referrer);
    if (resume) body.set("resume", resume);

    setState({ status: "submitting" });
    try {
      const res = await fetch(`${API_URL}/public/careers/${orgSlug}/jobs/${job.id}/apply`, { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: "error", message: json.message || "Something went wrong. Please try again." });
        return;
      }
      setState({ status: "done" });
    } catch {
      setState({ status: "error", message: "We couldn't reach the server. Check your connection and try again." });
    }
  };

  if (state.status === "done") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center" role="status">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-display text-[20px] font-semibold tracking-tight">Application sent</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Thanks for applying for {job.title}. The {orgName} team will review your application and get in touch by email.
        </p>
      </div>
    );
  }

  const submitting = state.status === "submitting";

  return (
    <form onSubmit={submit} noValidate={false} className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="apply-title">
      <h2 id="apply-title" className="font-display text-[19px] font-semibold tracking-tight">
        Apply for this role
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">Takes about 3 minutes. No account needed.</p>

      {state.status === "error" && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" /> {state.message}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Field id="fullName" label="Full name" required>
          <input id="fullName" name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="input" />
        </Field>
        <Field id="email" label="Email" required>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field id="phone" label="Phone">
            <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="input" />
          </Field>
          <Field id="location" label="Current location">
            <input id="location" name="location" maxLength={120} autoComplete="address-level2" className="input" />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-medium">
            Résumé / CV <span className="font-normal text-muted-foreground">(optional)</span>
          </div>
          <input
            ref={fileRef}
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => {
              pickResume(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {resume ? (
            <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border bg-background px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{resume.name}</span>
              <button type="button" onClick={() => setResume(null)} aria-label="Remove résumé" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border-strong bg-background px-3 py-4 text-[13.5px] font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <Upload className="size-4" aria-hidden="true" /> Upload PDF, DOC or DOCX (max 5 MB)
            </button>
          )}
        </div>

        <Field id="linkedinUrl" label="LinkedIn profile">
          <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/in/…" maxLength={500} className="input" />
        </Field>
        <Field id="portfolioUrl" label="Portfolio or website">
          <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://" maxLength={500} className="input" />
        </Field>
        <Field id="coverLetter" label="Cover letter">
          <textarea id="coverLetter" name="coverLetter" rows={4} maxLength={10000} className="input" />
        </Field>

        {job.questions.map((q) => (
          <QuestionField key={q.id} q={q} />
        ))}

        {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] bg-secondary/60 p-3 text-[12.5px] leading-relaxed">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" aria-required="true" />
          <span>
            I agree that {orgName} may store and process the information in this application to evaluate me for this and similar roles, as described in the{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
              privacy notice
            </Link>
            . <span className="text-destructive">*</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary text-[14.5px] font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-70"
        )}
      >
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
