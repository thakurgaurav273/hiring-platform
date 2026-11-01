import { describe, expect, it } from "vitest";
import { Role } from "@/constants/enums";
import { clearedValues, countActive, multi, resolveFilters, single } from "../engine";
import type { FilterConfig } from "../types";

type Data = { jobs: { id: string; title: string; department: string }[] };

const data: Data = {
  jobs: [
    { id: "j1", title: "Designer", department: "Design" },
    { id: "j2", title: "Engineer", department: "Engineering" },
    { id: "j3", title: "Data Analyst", department: "Engineering" },
  ],
};

const config: FilterConfig<Data> = {
  title: "Test",
  fields: [
    {
      id: "department",
      label: "Department",
      type: "single",
      allLabel: "All",
      roles: [Role.ADMINISTRATOR],
      options: ({ data }) => [...new Set(data.jobs.map((j) => j.department))].map((d) => ({ value: d, label: d })),
    },
    {
      id: "job",
      label: "Job",
      type: "single",
      required: true,
      options: ({ data, values }) =>
        data.jobs
          .filter((j) => !values.department?.length || values.department.includes(j.department))
          .map((j) => ({ value: j.id, label: j.title })),
    },
    {
      id: "stage",
      label: "Stage",
      type: "multi",
      options: [
        { value: "APPLIED", label: "Applied" },
        { value: "HIRED", label: "Hired" },
      ],
    },
  ],
};

describe("resolveFilters", () => {
  it("defaults a required single-select field to its first option", () => {
    const { values } = resolveFilters(config, data, Role.ADMINISTRATOR, {});
    expect(values).toEqual({ department: [], job: ["j1"], stage: [] });
  });

  it("narrows dependent options and re-defaults the required field", () => {
    const { values, fields } = resolveFilters(config, data, Role.ADMINISTRATOR, { department: ["Engineering"], job: ["j1"] });
    expect(fields.find((f) => f.field.id === "job")!.options.map((o) => o.value)).toEqual(["j2", "j3"]);
    // j1 (Design) is no longer offered, so the job falls back to the first Engineering job.
    expect(values.job).toEqual(["j2"]);
  });

  it("keeps a valid selection", () => {
    const { values } = resolveFilters(config, data, Role.ADMINISTRATOR, { department: ["Engineering"], job: ["j3"] });
    expect(single(values, "job")).toBe("j3");
  });

  it("hides fields from roles that cannot see them and ignores their values", () => {
    const { values, fields } = resolveFilters(config, data, Role.RECRUITER, { department: ["Design"] });
    expect(fields.map((f) => f.field.id)).toEqual(["job", "stage"]);
    expect(values.department).toBeUndefined();
    // Without the department narrowing, every job is offered.
    expect(fields[0].options).toHaveLength(3);
  });

  it("drops unknown values and keeps at most one value for single-select", () => {
    const { values } = resolveFilters(config, data, Role.ADMINISTRATOR, {
      department: ["Design", "Engineering"],
      stage: ["HIRED", "NOPE"],
    });
    expect(values.department).toEqual(["Design"]);
    expect(values.stage).toEqual(["HIRED"]);
  });
});

describe("helpers", () => {
  it("counts only user-chosen filters, not required defaults", () => {
    const { values, fields } = resolveFilters(config, data, Role.ADMINISTRATOR, { department: ["Design"], stage: ["APPLIED", "HIRED"] });
    expect(countActive(fields, values)).toBe(3);
    const empty = resolveFilters(config, data, Role.ADMINISTRATOR, {});
    expect(countActive(empty.fields, empty.values)).toBe(0);
  });

  it("clears every field", () => {
    expect(clearedValues(config)).toEqual({ department: [], job: [], stage: [] });
  });

  it("returns undefined for empty multi-select (for query params)", () => {
    expect(multi({ stage: [] }, "stage")).toBeUndefined();
    expect(multi({ stage: ["HIRED"] }, "stage")).toEqual(["HIRED"]);
  });
});
