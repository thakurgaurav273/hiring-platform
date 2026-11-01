/**
 * Seeds realistic demo data for one organization: teammates, open jobs,
 * candidates with applications, and interviews (upcoming, completed with
 * feedback, cancelled) with panels.
 *
 *   npm run seed:demo                       # organization "grovyn"
 *   npm run seed:demo -- --org acme
 *
 * Safe to re-run: demo candidates are tagged "demo-seed" and replaced on each
 * run; demo teammates and jobs are matched by email / title and reused. Real
 * data is never modified. Refuses to run when NODE_ENV=production.
 *
 * Teammates get the password in DEMO_USER_PASSWORD, or a random one that is
 * printed once.
 */
import crypto from "crypto";
import {
    ApplicationSourceType,
    FeedbackType,
    InterviewStatus,
    InterviewType,
    PipelineStage,
    Prisma,
    Recommendation,
    Role,
} from "@prisma/client";
import prisma from "../database/prisma-client";
import { hashPassword } from "../common/utils/hash.util";

const DEMO_TAG = "demo-seed";

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Local date `days` from today at hh:mm. */
function at(days: number, hh: number, mm = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hh, mm, 0, 0);
    return d;
}

/** Today at the next half hour + `hours`. */
function laterToday(hours: number) {
    const d = new Date();
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
    d.setHours(d.getHours() + hours);
    return d;
}

const meet = () => {
    const part = (n: number) => Array.from({ length: n }, () => "abcdefghijkmnpqrstuvwxyz"[crypto.randomInt(24)]).join("");
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
};

async function main() {
    if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
        console.error("Refusing to seed demo data with NODE_ENV=production (pass --force to override).");
        process.exit(1);
    }

    const slug = arg("org") ?? "grovyn";
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) {
        console.error(`Organization "${slug}" not found.`);
        process.exit(1);
    }
    const admin = await prisma.user.findFirst({
        where: { organizationId: org.id, role: "administrator", isActive: true },
        orderBy: { createdAt: "asc" },
    });
    if (!admin) {
        console.error(`Organization "${slug}" has no active administrator.`);
        process.exit(1);
    }
    const domain = admin.email.split("@")[1];

    // ── Teammates ───────────────────────────────────────────────────────────
    const generated = !process.env.DEMO_USER_PASSWORD;
    const password = process.env.DEMO_USER_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
    const passwordHash = await hashPassword(password);

    const teamSpec: { key: string; first: string; last: string; role: Role; department?: string; title: string }[] = [
        { key: "meera", first: "Meera", last: "Iyer", role: "hiring_manager", department: "Engineering", title: "Engineering Manager" },
        { key: "sana", first: "Sana", last: "Kapoor", role: "hiring_manager", department: "Design", title: "Head of Design" },
        { key: "arjun", first: "Arjun", last: "Mehta", role: "recruiter", title: "Talent Partner" },
        { key: "kavya", first: "Kavya", last: "Reddy", role: "employee", department: "Engineering", title: "Staff Engineer" },
        { key: "rohan", first: "Rohan", last: "Das", role: "employee", department: "Engineering", title: "Senior Backend Engineer" },
        { key: "ishita", first: "Ishita", last: "Bose", role: "employee", department: "Design", title: "Senior Product Designer" },
    ];
    const team: Record<string, { id: string; name: string }> = {};
    for (const t of teamSpec) {
        const email = `${t.first}.${t.last}@${domain}`.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.organizationId !== org.id) {
            console.error(`${email} belongs to another organization; aborting.`);
            process.exit(1);
        }
        const user = existing
            ? await prisma.user.update({
                  where: { id: existing.id },
                  data: { firstName: t.first, lastName: t.last, role: t.role, department: t.department ?? null, title: t.title, isActive: true },
              })
            : await prisma.user.create({
                  data: {
                      organizationId: org.id,
                      email,
                      password: passwordHash,
                      firstName: t.first,
                      lastName: t.last,
                      role: t.role,
                      department: t.department,
                      title: t.title,
                      invitedById: admin.id,
                  },
              });
        team[t.key] = { id: user.id, name: `${t.first} ${t.last}` };
    }

    // ── Jobs (reuse by title) ───────────────────────────────────────────────
    const jobSpec = [
        {
            key: "frontend",
            title: "Senior Frontend Engineer",
            department: "Engineering",
            location: "Bengaluru, India",
            hm: "meera",
            team: ["kavya"],
            skills: ["React", "TypeScript", "Next.js"],
            description:
                "Build the candidate and recruiter experience of our product. You'll own the Next.js app, the design system and accessibility.",
        },
        {
            key: "backend",
            title: "Backend Engineer (Node.js)",
            department: "Engineering",
            location: "Remote, India",
            hm: "meera",
            team: ["rohan"],
            skills: ["Node.js", "PostgreSQL", "Prisma"],
            description:
                "Design and run the APIs behind our hiring platform: ingestion, search, notifications and integrations with job boards.",
        },
        {
            key: "designer",
            title: "Product Designer",
            department: "Design",
            location: "Pune, India",
            hm: "sana",
            team: ["ishita"],
            skills: ["Figma", "Design systems", "User research"],
            description:
                "Shape end-to-end flows for recruiters and hiring managers, from first application to signed offer.",
        },
    ] as const;
    const jobs: Record<string, { id: string; title: string; department: string }> = {};
    for (const j of jobSpec) {
        let job = await prisma.job.findFirst({ where: { organizationId: org.id, title: j.title } });
        if (!job) {
            job = await prisma.job.create({
                data: {
                    organizationId: org.id,
                    title: j.title,
                    department: j.department,
                    location: j.location,
                    employmentType: "FULL_TIME",
                    experience: "4+ years",
                    skills: [...j.skills],
                    description: j.description,
                    status: "OPEN",
                    numOpenings: 1,
                    applicationDeadline: at(45, 23, 59),
                    recruiterId: team.arjun.id,
                    hiringManagerId: team[j.hm].id,
                    createdById: admin.id,
                },
            });
            const now = new Date();
            for (const channel of ["CAREERS_PAGE", "WEBSITE_EMBED"] as const) {
                await prisma.jobPublication.create({
                    data: { organizationId: org.id, jobId: job.id, channel, status: "PUBLISHED", publishedAt: now, lastSyncedAt: now, updatedById: admin.id },
                });
            }
        }
        await prisma.job.update({
            where: { id: job.id },
            data: { hiringTeamMembers: { connect: j.team.map((k) => ({ id: team[k].id })) } },
        });
        jobs[j.key] = { id: job.id, title: job.title, department: job.department };
    }

    // ── Replace previous demo candidates ───────────────────────────────────
    const old = await prisma.candidate.findMany({ where: { organizationId: org.id, tags: { has: DEMO_TAG } }, select: { id: true } });
    if (old.length) {
        const ids = old.map((c) => c.id);
        // ActivityLog doesn't cascade from Candidate.
        await prisma.activityLog.deleteMany({ where: { candidateId: { in: ids } } });
        await prisma.candidate.deleteMany({ where: { id: { in: ids } } });
    }

    // ── Candidates, applications and interviews ────────────────────────────
    type InterviewSpec = {
        type: InterviewType;
        when: Date;
        mins: number;
        status: InterviewStatus;
        panel: string[];
        place: "meet" | "zoom" | "onsite" | "phone";
        feedback?: { by: string; rating: number; rec: Recommendation; type: FeedbackType; comments: string }[];
    };
    type CandidateSpec = {
        first: string;
        last: string;
        location: string;
        job: keyof typeof jobs;
        source: ApplicationSourceType;
        sourceName: string;
        stage: PipelineStage;
        appliedDaysAgo: number;
        skills: string[];
        interviews: InterviewSpec[];
    };

    const candidates: CandidateSpec[] = [
        {
            first: "Aditi", last: "Sharma", location: "Bengaluru", job: "frontend", source: "LINKEDIN", sourceName: "LinkedIn",
            stage: "TECHNICAL_ROUND", appliedDaysAgo: 12, skills: ["React", "TypeScript"],
            interviews: [
                { type: "SCREENING", when: at(-6, 11), mins: 30, status: "COMPLETED", panel: ["arjun"], place: "phone",
                  feedback: [{ by: "arjun", rating: 4, rec: "YES", type: "HR", comments: "Clear communicator, motivated by product work. Notice period 30 days." }] },
                { type: "TECHNICAL", when: laterToday(1), mins: 60, status: "SCHEDULED", panel: ["kavya", "meera"], place: "meet" },
            ],
        },
        {
            first: "Rahul", last: "Verma", location: "Hyderabad", job: "frontend", source: "EMPLOYEE_REFERRAL", sourceName: "Employee referral",
            stage: "INTERVIEW_SCHEDULED", appliedDaysAgo: 5, skills: ["React", "GraphQL"],
            interviews: [{ type: "SCREENING", when: laterToday(4), mins: 30, status: "SCHEDULED", panel: ["arjun"], place: "zoom" }],
        },
        {
            first: "Neha", last: "Kulkarni", location: "Pune", job: "designer", source: "CAREERS_PAGE", sourceName: "Robin Talent Careers",
            stage: "HR_ROUND", appliedDaysAgo: 18, skills: ["Figma", "Prototyping"],
            interviews: [
                { type: "SCREENING", when: at(-10, 15), mins: 30, status: "COMPLETED", panel: ["arjun"], place: "phone",
                  feedback: [{ by: "arjun", rating: 4, rec: "YES", type: "HR", comments: "Strong portfolio, thoughtful about accessibility." }] },
                { type: "TECHNICAL", when: at(-3, 14), mins: 60, status: "COMPLETED", panel: ["ishita", "sana"], place: "meet",
                  feedback: [
                      { by: "ishita", rating: 5, rec: "STRONG_YES", type: "TECHNICAL", comments: "Excellent design critique. Walked through trade-offs clearly." },
                      { by: "sana", rating: 4, rec: "YES", type: "TECHNICAL", comments: "Good systems thinking; wants more depth in research." },
                  ] },
                { type: "HR", when: at(1, 10, 30), mins: 45, status: "SCHEDULED", panel: ["arjun"], place: "onsite" },
            ],
        },
        {
            first: "Vikram", last: "Nair", location: "Chennai", job: "backend", source: "NAUKRI", sourceName: "Naukri",
            stage: "INTERVIEW_COMPLETED", appliedDaysAgo: 9, skills: ["Node.js", "PostgreSQL"],
            interviews: [
                { type: "TECHNICAL", when: at(-1, 16), mins: 60, status: "COMPLETED", panel: ["rohan", "kavya"], place: "meet",
                  feedback: [{ by: "rohan", rating: 3, rec: "NEUTRAL", type: "TECHNICAL", comments: "Solid fundamentals; struggled with query optimisation." }] },
            ],
        },
        {
            first: "Priyanka", last: "Ghosh", location: "Kolkata", job: "backend", source: "LINKEDIN", sourceName: "LinkedIn",
            stage: "INTERVIEW_COMPLETED", appliedDaysAgo: 7, skills: ["Go", "Node.js", "AWS"],
            interviews: [{ type: "SCREENING", when: at(-2, 12), mins: 30, status: "COMPLETED", panel: ["arjun"], place: "phone" }],
        },
        {
            first: "Karan", last: "Malhotra", location: "Gurugram", job: "backend", source: "EMPLOYEE_REFERRAL", sourceName: "Employee referral",
            stage: "OFFER_SENT", appliedDaysAgo: 24, skills: ["Node.js", "Kafka", "PostgreSQL"],
            interviews: [
                { type: "TECHNICAL", when: at(-12, 11), mins: 60, status: "COMPLETED", panel: ["rohan"], place: "meet",
                  feedback: [{ by: "rohan", rating: 5, rec: "STRONG_YES", type: "TECHNICAL", comments: "Designed a clean event pipeline; great debugging instincts." }] },
                { type: "MANAGERIAL", when: at(-7, 17), mins: 45, status: "COMPLETED", panel: ["meera"], place: "meet",
                  feedback: [{ by: "meera", rating: 5, rec: "STRONG_YES", type: "HR", comments: "Owns outcomes, good mentor. Recommend offer." }] },
            ],
        },
        {
            first: "Ananya", last: "Rao", location: "Bengaluru", job: "frontend", source: "COMPANY_WEBSITE", sourceName: "Company website",
            stage: "INTERVIEW_SCHEDULED", appliedDaysAgo: 4, skills: ["Vue", "React", "CSS"],
            interviews: [{ type: "MANAGERIAL", when: at(2, 15), mins: 45, status: "SCHEDULED", panel: ["meera"], place: "meet" }],
        },
        {
            first: "Siddharth", last: "Joshi", location: "Mumbai", job: "designer", source: "INDEED", sourceName: "Indeed",
            stage: "INTERVIEW_SCHEDULED", appliedDaysAgo: 6, skills: ["Figma", "Motion"],
            interviews: [{ type: "FINAL", when: at(3, 11), mins: 60, status: "SCHEDULED", panel: ["sana", "ishita", "arjun"], place: "onsite" }],
        },
        {
            first: "Farah", last: "Khan", location: "Delhi", job: "backend", source: "CAREERS_PAGE", sourceName: "Robin Talent Careers",
            stage: "SHORTLISTED", appliedDaysAgo: 3, skills: ["Python", "Node.js"],
            interviews: [{ type: "TECHNICAL", when: at(6, 14, 30), mins: 60, status: "SCHEDULED", panel: ["rohan"], place: "meet" }],
        },
        {
            first: "Dev", last: "Patel", location: "Ahmedabad", job: "frontend", source: "LINKEDIN", sourceName: "LinkedIn",
            stage: "REJECTED", appliedDaysAgo: 15, skills: ["Angular"],
            interviews: [
                { type: "TECHNICAL", when: at(-5, 10), mins: 60, status: "COMPLETED", panel: ["kavya"], place: "meet",
                  feedback: [{ by: "kavya", rating: 2, rec: "NO", type: "TECHNICAL", comments: "Limited React experience for a senior role." }] },
            ],
        },
        {
            first: "Meghna", last: "Pillai", location: "Kochi", job: "designer", source: "LINKEDIN", sourceName: "LinkedIn",
            stage: "SCREENING", appliedDaysAgo: 2, skills: ["Figma", "UX writing"],
            interviews: [
                { type: "SCREENING", when: at(4, 16), mins: 30, status: "CANCELLED", panel: ["arjun"], place: "phone" },
                { type: "SCREENING", when: at(8, 12), mins: 30, status: "SCHEDULED", panel: ["arjun"], place: "zoom" },
            ],
        },
    ];

    const STAGE_PATH: PipelineStage[] = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "TECHNICAL_ROUND", "HR_ROUND", "OFFER_SENT", "HIRED"];
    const placeOf = (p: InterviewSpec["place"]) =>
        p === "meet" ? { location: "Google Meet", meetingLink: meet() }
        : p === "zoom" ? { location: "Zoom", meetingLink: `https://zoom.us/j/${crypto.randomInt(1e9, 9.99e9)}` }
        : p === "onsite" ? { location: "Grovyn office, Bengaluru – Meeting room 3", meetingLink: null }
        : { location: "Phone call", meetingLink: null };

    let interviewCount = 0;
    let feedbackCount = 0;
    for (const c of candidates) {
        const email = `${c.first}.${c.last}@example.com`.toLowerCase();
        const job = jobs[c.job];
        const appliedAt = at(-c.appliedDaysAgo, 9, 15);
        const candidate = await prisma.candidate.create({
            data: {
                organizationId: org.id,
                firstName: c.first,
                lastName: c.last,
                email,
                emailNormalized: email,
                location: c.location,
                skills: c.skills,
                tags: [DEMO_TAG],
                source: c.sourceName,
                createdAt: appliedAt,
            },
        });
        const application = await prisma.application.create({
            data: {
                candidateId: candidate.id,
                jobId: job.id,
                currentStage: c.stage,
                appliedAt,
                createdAt: appliedAt,
                sourceType: c.source,
                sourceName: c.sourceName,
                referredById: c.source === "EMPLOYEE_REFERRAL" ? team.kavya.id : null,
            },
        });
        await prisma.timelineEvent.create({
            data: { candidateId: candidate.id, applicationId: application.id, type: "APPLICATION_CREATED", title: `Applied for ${job.title}`, createdAt: appliedAt },
        });

        // Stage history up to the current stage
        const target = c.stage === "REJECTED" ? "INTERVIEW_COMPLETED" : c.stage;
        const path = STAGE_PATH.slice(0, STAGE_PATH.indexOf(target) + 1);
        if (c.stage === "REJECTED") path.push("REJECTED");
        for (let i = 1; i < path.length; i++) {
            await prisma.pipelineHistory.create({
                data: {
                    applicationId: application.id,
                    fromStage: path[i - 1],
                    toStage: path[i],
                    changedById: team.arjun.id,
                    createdAt: new Date(appliedAt.getTime() + i * 36e5 * 20),
                },
            });
        }

        for (const iv of c.interviews) {
            const interview = await prisma.interview.create({
                data: {
                    applicationId: application.id,
                    type: iv.type,
                    status: iv.status,
                    scheduledAt: iv.when,
                    durationMins: iv.mins,
                    ...placeOf(iv.place),
                    createdAt: new Date(Math.min(iv.when.getTime() - 2 * 864e5, Date.now())),
                    panelists: { create: iv.panel.map((k) => ({ interviewerId: team[k].id })) },
                },
            });
            interviewCount++;
            await prisma.timelineEvent.create({
                data: {
                    candidateId: candidate.id,
                    applicationId: application.id,
                    type: "INTERVIEW_SCHEDULED",
                    title: `${iv.type.charAt(0)}${iv.type.slice(1).toLowerCase()} interview ${iv.status === "CANCELLED" ? "cancelled" : "scheduled"}`,
                    metadata: { interviewId: interview.id, scheduledAt: iv.when.toISOString() } as Prisma.InputJsonValue,
                    actorId: team.arjun.id,
                    createdAt: new Date(Math.min(iv.when.getTime() - 2 * 864e5, Date.now())),
                },
            });
            for (const f of iv.feedback ?? []) {
                const submitted = new Date(iv.when.getTime() + (iv.mins + 90) * 6e4);
                await prisma.feedback.create({
                    data: {
                        applicationId: application.id,
                        interviewId: interview.id,
                        interviewerId: team[f.by].id,
                        type: f.type,
                        rating: f.rating,
                        recommendation: f.rec,
                        comments: f.comments,
                        createdAt: submitted,
                    },
                });
                feedbackCount++;
                await prisma.timelineEvent.create({
                    data: {
                        candidateId: candidate.id,
                        applicationId: application.id,
                        type: "FEEDBACK_ADDED",
                        title: `${team[f.by].name} left feedback`,
                        actorId: team[f.by].id,
                        createdAt: submitted,
                    },
                });
            }
        }
    }

    console.log(`Seeded demo data for "${org.name}" (${slug}):`);
    console.log(`  teammates:   ${Object.keys(team).length} (${Object.values(team).map((t) => t.name).join(", ")})`);
    console.log(`  open jobs:   ${Object.values(jobs).map((j) => j.title).join(", ")}`);
    console.log(`  candidates:  ${candidates.length} (tagged "${DEMO_TAG}")`);
    console.log(`  interviews:  ${interviewCount}, feedback entries: ${feedbackCount}`);
    if (generated) {
        console.log(`  teammate password (new accounts only): ${password}`);
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
