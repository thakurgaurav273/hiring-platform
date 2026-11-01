"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplicationQuestion } from "@/lib/careers";

export const MAX_QUESTIONS = 20;
const MAX_OPTIONS = 20;

const TYPE_LABELS: Record<ApplicationQuestion["type"], string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  yes_no: "Yes / No",
  single_choice: "Multiple choice (pick one)",
};

/**
 * Builds a stable id for a new question. Ids are what answers are stored
 * against, so existing questions keep theirs when the label is edited.
 */
function newId(existing: ApplicationQuestion[]) {
  const taken = new Set(existing.map((q) => q.id));
  for (let i = existing.length + 1; ; i++) {
    const id = `q${i}`;
    if (!taken.has(id)) return id;
  }
}

/** Returns the first problem with the questions, or null when they can be saved. */
export function validateQuestions(questions: ApplicationQuestion[]): string | null {
  for (const [i, q] of questions.entries()) {
    const n = `Question ${i + 1}`;
    if (!q.label.trim()) return `${n} needs a question.`;
    if (q.type === "single_choice") {
      const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) return `${n} needs at least two choices.`;
      if (new Set(opts).size !== opts.length) return `${n} has the same choice twice.`;
    }
  }
  return null;
}

/** Cleans questions for the API: trims text and drops options on non-choice questions. */
export function serializeQuestions(questions: ApplicationQuestion[]): ApplicationQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    label: q.label.trim(),
    type: q.type,
    required: q.required,
    ...(q.type === "single_choice" ? { options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) } : {}),
  }));
}

export function ApplicationQuestionsEditor({
  value,
  onChange,
}: {
  value: ApplicationQuestion[];
  onChange: (next: ApplicationQuestion[]) => void;
}) {
  const update = (i: number, patch: Partial<ApplicationQuestion>) =>
    onChange(value.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = () =>
    onChange([...value, { id: newId(value), label: "", type: "short_text", required: false }]);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-surface-2 p-4 text-[12.5px] text-muted-foreground">
          Applicants give their name, email, résumé and links. Add questions here to ask anything else, such as notice period
          or work authorisation.
        </p>
      )}

      {value.map((q, i) => {
        const labelId = `q-label-${q.id}`;
        return (
          <fieldset key={q.id} className="rounded-lg border border-border bg-surface p-4">
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[220px] flex-1">
                <label htmlFor={labelId} className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
                  Question {i + 1}
                </label>
                <input
                  id={labelId}
                  value={q.label}
                  maxLength={300}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="e.g. What is your notice period?"
                  className="input"
                />
              </div>
              <div className="w-full sm:w-56">
                <label htmlFor={`q-type-${q.id}`} className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
                  Answer type
                </label>
                <select
                  id={`q-type-${q.id}`}
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as ApplicationQuestion["type"];
                    update(i, { type, options: type === "single_choice" ? (q.options?.length ? q.options : ["", ""]) : undefined });
                  }}
                  className="input"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {q.type === "single_choice" && (
              <div className="mt-3 space-y-2">
                <span className="block text-[11.5px] font-medium text-muted-foreground">Choices</span>
                {(q.options ?? []).map((o, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      value={o}
                      maxLength={120}
                      aria-label={`Question ${i + 1}, choice ${k + 1}`}
                      onChange={(e) => update(i, { options: (q.options ?? []).map((x, m) => (m === k ? e.target.value : x)) })}
                      placeholder={`Choice ${k + 1}`}
                      className="input h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove choice ${k + 1}`}
                      disabled={(q.options ?? []).length <= 2}
                      onClick={() => update(i, { options: (q.options ?? []).filter((_, m) => m !== k) })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {(q.options ?? []).length < MAX_OPTIONS && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => update(i, { options: [...(q.options ?? []), ""] })}>
                    <Plus /> Add choice
                  </Button>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <label className="inline-flex items-center gap-2 text-[12.5px]">
                <Checkbox checked={q.required} onCheckedChange={(v) => update(i, { required: v === true })} />
                Required
              </label>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  <Trash2 /> Remove
                </Button>
              </div>
            </div>
          </fieldset>
        );
      })}

      {value.length < MAX_QUESTIONS && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> Add question
        </Button>
      )}
    </div>
  );
}
