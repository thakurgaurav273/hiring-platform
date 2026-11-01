import dashboardRepository from "./dashboard.repository";
import { Prisma, Role } from "@prisma/client";

export const getDashboardData = async (user: any) => {
    const isRecruiterOrEmployee = user.role === Role.recruiter || user.role === Role.employee;
    const isManager = user.role === Role.hiring_manager;

    // Build base where filters based on RBAC
    const jobWhere: Prisma.JobWhereInput = isManager && user.department ? { department: user.department } : {};
    
    const candidateWhere: Prisma.CandidateWhereInput = isRecruiterOrEmployee 
        ? { referredBy: user.id } 
        : (isManager && user.department ? { applications: { some: { job: { department: user.department } } } } : {});

    const applicationWhere: Prisma.ApplicationWhereInput = isRecruiterOrEmployee
        ? { candidate: { referredBy: user.id } }
        : (isManager && user.department ? { job: { department: user.department } } : {});
        
    const interviewWhere: Prisma.InterviewWhereInput = isRecruiterOrEmployee
        ? { application: { candidate: { referredBy: user.id } } }
        : (isManager && user.department ? { application: { job: { department: user.department } } } : {});

    const timelineWhere: Prisma.TimelineEventWhereInput = { actorId: user.id };

    // Common Metrics for all roles
    const [
        totalReferrals,
        hiredReferrals,
        rejectedReferrals,
        avgTimeToHireReferrals
    ] = await Promise.all([
        dashboardRepository.countCandidates({ referredBy: user.id }),
        dashboardRepository.countCandidatesByStage("HIRED", { referredBy: user.id }),
        dashboardRepository.countCandidatesByStage("REJECTED", { referredBy: user.id }),
        dashboardRepository.getAverageTimeToHire({ referredBy: user.id }),
    ]);

    const conversionRate = totalReferrals > 0 ? Math.round((hiredReferrals / totalReferrals) * 100) : 0;

    let kpis = [];

    if (isRecruiterOrEmployee) {
        kpis = [
            { label: "Total Referrals", value: totalReferrals.toString() },
            { label: "Hired", value: hiredReferrals.toString() },
            { label: "Rejected", value: rejectedReferrals.toString() },
            { label: "Conversion Rate", value: `${conversionRate}%` },
            { label: "Avg. Time to Hire", value: `${avgTimeToHireReferrals}d` },
        ];
    } else {
        const [
            openJobs,
            activeCandidates,
            interviewsScheduled,
            offersSent,
            hiredCandidates,
            avgTimeToHireAll
        ] = await Promise.all([
            dashboardRepository.countActiveJobs(jobWhere),
            dashboardRepository.countActiveCandidates(candidateWhere),
            dashboardRepository.countUpcomingInterviews(interviewWhere),
            dashboardRepository.countCandidatesByStage("OFFER_SENT", candidateWhere),
            dashboardRepository.countCandidatesByStage("HIRED", candidateWhere),
            dashboardRepository.getAverageTimeToHire(candidateWhere),
        ]);

        kpis = [
            { label: "Open Jobs", value: openJobs.toString(), to: "/jobs" },
            { label: "Active Candidates", value: activeCandidates.toString(), to: "/candidates" },
            { label: "Interviews Scheduled", value: interviewsScheduled.toString(), to: "/interviews" },
            { label: "Offers Sent", value: offersSent.toString(), to: "/pipeline" },
            { label: "Hires", value: hiredCandidates.toString(), to: "/reports" },
            { label: "My Referrals", value: totalReferrals.toString(), to: "/referrals" },
            { label: "Ref. Conversion", value: `${conversionRate}%`, to: "/referrals" },
            { label: "Avg. Time to Hire", value: `${avgTimeToHireAll}d`, to: "/reports" },
        ];
    }

    const [funnelRaw, recentApplications, upcomingInterviewsRaw, recentEmails, recentActivitiesRaw] = await Promise.all([
        dashboardRepository.getFunnelCounts(applicationWhere),
        dashboardRepository.getRecentApplications(applicationWhere),
        dashboardRepository.getUpcomingInterviews(interviewWhere),
        dashboardRepository.getRecentEmails({ to: user.email }),
        dashboardRepository.getRecentActivities({ actorId: user.id }),
    ]);

    const upcomingInterviews = upcomingInterviewsRaw.map((i: any) => ({
        ...i,
        candidate: i.application.candidate,
        job: i.application.job
    }));

    // Map ActivityLog DB fields → frontend shape (action, details)
    const recentEvents = recentActivitiesRaw.map((a: any) => ({
        id: a.id,
        action: a.type,
        details: a.description ?? "",
        createdAt: a.createdAt,
        type: a.entityType,
    }));

    // Format funnel bars — keys must match Prisma's PipelineStage enum values
    const STAGE_ORDER = [
        "APPLIED",
        "SCREENING",
        "SHORTLISTED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW_COMPLETED",
        "TECHNICAL_ROUND",
        "HR_ROUND",
        "OFFER_SENT",
        "HIRED",
        "REJECTED",
    ] as const;

    const STAGE_LABELS: Record<string, string> = {
        APPLIED: "Applied",
        SCREENING: "Screening",
        SHORTLISTED: "Shortlisted",
        INTERVIEW_SCHEDULED: "Interview Scheduled",
        INTERVIEW_COMPLETED: "Interview Completed",
        TECHNICAL_ROUND: "Technical Interview",
        HR_ROUND: "HR Round",
        OFFER_SENT: "Offer Sent",
        HIRED: "Hired",
        REJECTED: "Rejected",
    };

    // Default 0 for all stages
    const funnelMap: Record<string, number> = STAGE_ORDER.reduce(
        (acc, key) => ({ ...acc, [key]: 0 }),
        {}
    );

    // Map raw Prisma groupBy results — f.currentStage is already the enum key
    funnelRaw.forEach((f: any) => {
        if (f.currentStage in funnelMap) {
            funnelMap[f.currentStage] = f._count.id;
        }
    });

    const funnelBars = STAGE_ORDER.map((key) => ({
        stage: STAGE_LABELS[key],
        count: funnelMap[key],
    }));

    return {
        kpis,
        funnelBars,
        recentApplications,
        upcomingInterviews,
        recentEvents,
        recentEmails
    };
};

const dashboardService = {
    getDashboardData
};

export default dashboardService;
