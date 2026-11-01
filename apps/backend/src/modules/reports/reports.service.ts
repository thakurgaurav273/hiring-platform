import { Prisma, Role } from "@prisma/client";
import reportsRepository from "./reports.repository";

export const getReportsData = async (user: any) => {
    const isAdmin = user.role === Role.administrator;
    const isManager = user.role === Role.hiring_manager;

    // ── RBAC scoping ─────────────────────────────────────────────────────────
    // Admin  → org-wide (no filter)
    // Hiring Manager → scoped to their department
    const applicationWhere: Prisma.ApplicationWhereInput =
        isManager && user.department
            ? { job: { department: user.department } }
            : {};

    const interviewWhere: Prisma.InterviewWhereInput =
        isManager && user.department
            ? { application: { job: { department: user.department } } }
            : {};

    // ── Parallel data fetch ───────────────────────────────────────────────────
    const [
        totalApplications,
        totalInterviews,
        offersSent,
        hired,
        avgTimeToHire,
        applicationsOverTime,
        funnelStages,
    ] = await Promise.all([
        reportsRepository.countApplications(applicationWhere),
        reportsRepository.countScheduledInterviews(interviewWhere),
        reportsRepository.countOffersSent(applicationWhere),
        reportsRepository.countHired(applicationWhere),
        reportsRepository.getAvgTimeToHire(applicationWhere),
        reportsRepository.getApplicationsOverTime(applicationWhere),
        reportsRepository.getFunnelStages(applicationWhere),
    ]);

    // Offer acceptance rate = hired / offersSent * 100
    const offerAcceptanceRate =
        offersSent > 0 ? Math.round((hired / offersSent) * 100) : 0;

    // Applications per department — admin only (org-wide, not scoped)
    const applicationsPerDepartment = isAdmin
        ? await reportsRepository.getApplicationsPerDepartment()
        : [];

    // ── Build funnel with conversion rates ────────────────────────────────────
    const funnelWithConversion = funnelStages.map((s, i) => {
        const prev = i === 0 ? s.value : funnelStages[i - 1].value;
        const conv =
            i === 0 || prev === 0
                ? "—"
                : `${Math.round((s.value / prev) * 100)}%`;
        return { ...s, conv };
    });

    return {
        kpis: {
            totalApplications,
            totalInterviews,
            offerAcceptanceRate,
            avgTimeToHire,
        },
        applicationsOverTime,
        applicationsPerDepartment,
        funnelStages: funnelWithConversion,
    };
};

const reportsService = { getReportsData };
export default reportsService;
