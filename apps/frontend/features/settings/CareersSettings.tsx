"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard } from "@/features/settings/SettingsSections";
import { organizationService } from "@/services/api/organization.service";
import { SITE_URL, careersPath, embedSnippet } from "@/lib/careers";
import { copyText } from "@/lib/copy-text";

const ABOUT_MAX = 2000;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    if (await copyText(value)) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } else {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return { copied, copy };
}

/** Settings → Careers & embed: public careers URL, About text, website embed code. */
export function CareersSettings({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["organization", "careers"],
    queryFn: organizationService.getCareersSettings,
  });
  const [about, setAbout] = useState("");
  useEffect(() => {
    if (data) setAbout(data.about ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: () => organizationService.updateCareersSettings({ about: about.trim() || null }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["organization", "careers"], saved);
      toast.success("Careers page updated. It can take up to a minute to appear.");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't save the careers page"),
  });
  const { copied, copy } = useCopy();

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="surface-card p-6 text-[13px] text-muted-foreground">Couldn&apos;t load careers settings.</div>;
  }

  const url = SITE_URL + careersPath(data.slug);
  const snippet = embedSnippet(data.slug);
  const dirty = (data.about ?? "") !== about.trim();

  return (
    <div className="space-y-4 py-4">
      <SettingsCard
        title="Careers page"
        description="Every open job is listed here automatically. Share this link anywhere you hire."
      >
        <div className="flex min-w-0 items-center gap-2">
          <input
            readOnly
            value={url}
            aria-label="Careers page link"
            onFocus={(e) => e.currentTarget.select()}
            className="input min-w-0 flex-1 font-mono text-[12px]"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => copy("url", url)}>
            {copied === "url" ? <Check className="text-success" /> : <Copy />} {copied === "url" ? "Copied" : "Copy"}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink /> <span className="sr-only sm:not-sr-only">Open</span>
            </a>
          </Button>
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <label htmlFor="careers-about" className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
            About the company
          </label>
          <textarea
            id="careers-about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={ABOUT_MAX}
            rows={5}
            disabled={!canEdit}
            placeholder="A few sentences candidates see at the top of your careers page."
            aria-describedby="careers-about-help"
            className="input min-h-[120px] py-2 leading-relaxed"
          />
          <div id="careers-about-help" className="mt-1 flex justify-between text-[11.5px] text-muted-foreground">
            <span>{canEdit ? "Plain text. Line breaks are kept." : "Only people who manage branding can change this."}</span>
            <span>
              {about.length}/{ABOUT_MAX}
            </span>
          </div>
          {canEdit && (
            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" disabled={!dirty || save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Save
              </Button>
            </div>
          )}
        </form>
      </SettingsCard>

      <SettingsCard
        title="Embed on your website"
        description="Paste this where your jobs should appear on your own site. It lists jobs published to the website destination and updates on its own."
      >
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 pr-24 font-mono text-[12px] leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copy("snippet", snippet)}
            className="absolute right-2 top-2"
            aria-label="Copy embed code"
          >
            {copied === "snippet" ? <Check className="text-success" /> : <Copy />} {copied === "snippet" ? "Copied" : "Copy"}
          </Button>
        </div>
        <details className="mt-4 text-[12.5px] text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Options</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <code className="font-mono">data-layout=&quot;grid&quot;</code> shows jobs as cards instead of a list.
            </li>
            <li>
              <code className="font-mono">data-color=&quot;#A8320C&quot;</code> sets the accent colour. It defaults to your brand colour.
            </li>
            <li>
              <code className="font-mono">data-limit=&quot;5&quot;</code> shows at most that many jobs.
            </li>
            <li>
              <code className="font-mono">data-scheme=&quot;auto&quot;</code> follows the visitor&apos;s dark mode.
            </li>
            <li>
              <code className="font-mono">data-target=&quot;#jobs&quot;</code> renders into an existing element on the page.
            </li>
          </ul>
          <p className="mt-2">Applications from the widget are tagged with the source &quot;Company website&quot;.</p>
        </details>
      </SettingsCard>
    </div>
  );
}
