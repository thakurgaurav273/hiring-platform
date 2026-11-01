import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import candidateRepository from "./candidates.repository";
import { Prisma, PipelineStage } from "@prisma/client";
import prisma from "../../database/prisma-client";

export interface Actor {
    id: string;
    role: string;
    department?: string | null;
    organizationId: string;
}

/** 404 unless the candidate belongs to the actor's organization. */
async function assertCandidateInOrganization(candidateId: string, organizationId: string) {
    const found = await prisma.candidate.findFirst({ where: { id: candidateId, organizationId }, select: { id: true } });
    if (!found) throw new AppError("Candidate not found", StatusCodes.NOT_FOUND);
}

/**
 * Manual entry and employee referrals. Both go through the shared ingestion
 * service, so deduplication and source attribution match public applications.
 */
export const createCandidate = async (
    data: {
        firstName: string;
        lastName?: string;
        email: string;
        phone?: string;
        location?: string;
        experience?: unknown;
        skills?: string[];
        jobId: string;
        stage?: PipelineStage;
        education?: string;
        portfolio?: string;
        linkedin?: string;
        summary?: string;
        referredBy?: string;
        whySuggest?: string;
    },
    actor: Actor,
    resume?: Express.Multer.File
) => {
    const { ingestApplication } = await import("../applications/applications.service");
    // Employees can only refer on their own behalf.
    const referredById = data.referredBy || null;
    if (referredById && actor.role === "employee" && referredById !== actor.id) {
        throw new AppError("You can only submit referrals as yourself", StatusCodes.FORBIDDEN);
    }

    const result = await ingestApplication({
        organizationId: actor.organizationId,
        jobId: data.jobId,
        applicant: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            location: data.location,
            summary: data.summary,
            skills: data.skills,
            experience: data.experience,
            education: data.education,
            linkedinUrl: data.linkedin,
            portfolioUrl: data.portfolio,
        },
        source: referredById
            ? { type: "EMPLOYEE_REFERRAL", referredById }
            : { type: "MANUAL" },
        stage: data.stage,
        resume: resume ?? null,
        actorId: actor.id,
        note: data.whySuggest ? { content: data.whySuggest, authorId: actor.id } : null,
    });

    if (result.status === "duplicate") {
        throw new AppError("Candidate has already applied to this job", StatusCodes.CONFLICT);
    }
    return { id: result.candidateId, applicationId: result.applicationId, candidateCreated: result.candidateCreated };
};


export const getAllCandidates = async (query: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string | string[];
    stage?: PipelineStage | PipelineStage[];
    jobId?: string | string[];
    referredBy?: string;
}, user: Actor) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const { search, department, stage, jobId, referredBy } = query;

    const where: Prisma.ApplicationWhereInput = {};

    // Filter by referredBy
    if (referredBy) {
        where.candidate = {
            referredBy: referredBy
        };
    }

    // Filter by Job ID
    if (jobId) {
        if (Array.isArray(jobId)) {
            where.jobId = { in: jobId };
        } else {
            where.jobId = jobId;
        }
    }

    // Filter by Pipeline Stage
    if (stage) {
        if (Array.isArray(stage)) {
            where.currentStage = { in: stage };
        } else {
            where.currentStage = stage;
        }
    }

    const jobWhere: Prisma.JobWhereInput = {};

    // Filter by Job Department
    if (department) {
        if (Array.isArray(department)) {
            jobWhere.department = { in: department };
        } else {
            jobWhere.department = { contains: department, mode: "insensitive" };
        }
    }

    const isFetchingOwnReferrals = referredBy === user.id;

    if (!isFetchingOwnReferrals) {
        if (user.role === "hiring_manager") {
            if (user.department) {
                jobWhere.department = { equals: user.department, mode: "insensitive" };
            } else {
                jobWhere.department = { equals: "NONE_ASSIGNED_TO_THIS_USER", mode: "insensitive" };
            }
        }

        if (user.role === "recruiter" || user.role === "employee") {
            jobWhere.OR = [
                { recruiterId: user.id },
                { hiringManagerId: user.id },
                { createdById: user.id },
                { hiringTeamMembers: { some: { id: user.id } } },
            ];
        }
    }

    // Tenant isolation: only applications to this organization's jobs.
    jobWhere.organizationId = user.organizationId;
    where.job = jobWhere;

    // Search by name, email, job title, or candidate location
    if (search) {
        const keywords = search.split(/\s+/).filter(Boolean);
        if (keywords.length > 0) {
            where.OR = keywords.flatMap(keyword => [
                {
                    candidate: {
                        firstName: { contains: keyword, mode: "insensitive" },
                    },
                },
                {
                    candidate: {
                        lastName: { contains: keyword, mode: "insensitive" },
                    },
                },
                {
                    candidate: {
                        email: { contains: keyword, mode: "insensitive" },
                    },
                },
                {
                    candidate: {
                        location: { contains: keyword, mode: "insensitive" },
                    },
                },
                {
                    job: {
                        title: { contains: keyword, mode: "insensitive" },
                    },
                },
            ]);
        }
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
        candidateRepository.findAllApplications({
            skip,
            take: limit,
            where,
        }),
        candidateRepository.countApplications(where),
    ]);

    // Resolve referrer display names
    const referrerIds = [...new Set(applications.map(app => app.candidate.referredBy).filter(Boolean))] as string[];
    
    if (referrerIds.length > 0) {
        const prismaModule = await import("../../database/prisma-client");
        const prisma = prismaModule.default || prismaModule.prisma;
        
        const referrers = await prisma.user.findMany({
            where: { id: { in: referrerIds }, organizationId: user.organizationId },
            select: { id: true, firstName: true, lastName: true },
        });
        
        const referrerMap = new Map(referrers.map((user: any) => [user.id, `${user.firstName} ${user.lastName}`]));
        
        applications.forEach(app => {
            if (app.candidate.referredBy && referrerMap.has(app.candidate.referredBy)) {
                app.candidate.referredBy = referrerMap.get(app.candidate.referredBy) as string;
            }
        });
    }

    return {
        candidates: applications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getCandidateById = async (id: string, user: Actor) => {
    await assertCandidateInOrganization(id, user.organizationId);
    // Ensure any past interviews are marked as COMPLETED first
    const interviewsRepositoryModule = await import("../interviews/interviews.repository");
    await interviewsRepositoryModule.default.autoCompleteInterviews();

    const candidate = await candidateRepository.findCandidateById(id);

    if (!candidate) {
        throw new AppError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    if (user.role === "hiring_manager") {
        const hasAccess = candidate.applications.some(app => app.job.department.toLowerCase() === user.department?.toLowerCase());
        if (!hasAccess) throw new AppError("Forbidden: Candidate belongs to a different department", StatusCodes.FORBIDDEN);
    }

    if (user.role === "recruiter" || user.role === "employee") {
        const hasAccess = candidate.applications.some(app => 
            app.job.recruiterId === user.id || 
            app.job.hiringManagerId === user.id || 
            app.job.createdById === user.id ||
            app.job.hiringTeamMembers?.some((m: any) => m.id === user.id)
        );
        if (!hasAccess) throw new AppError("Forbidden: You are not assigned to this candidate's job hiring team", StatusCodes.FORBIDDEN);
    }

    if (candidate.referredBy) {
        const prismaModule = await import("../../database/prisma-client");
        const prisma = prismaModule.default || prismaModule.prisma;
        const referrer = await prisma.user.findUnique({
            where: { id: candidate.referredBy },
            select: { firstName: true, lastName: true },
        });
        if (referrer) {
            candidate.referredBy = `${referrer.firstName} ${referrer.lastName}`;
        }
    }

    return candidate;
};

export const updateCandidate = async (
    id: string,
    data: Prisma.CandidateUpdateInput,
    organizationId: string
) => {
    await assertCandidateInOrganization(id, organizationId);
    const existingCandidate = await candidateRepository.findCandidateById(id);

    if (!existingCandidate) {
        throw new AppError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    return await candidateRepository.updateCandidate(id, data);
};

import * as pipelineService from "../pipeline/pipeline.service";

const STAGES = [
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
];

export const updateCandidateStage = async (
    id: string,
    stage: PipelineStage,
    changedById?: string,
    user?: Actor
) => {
    if (user) await assertCandidateInOrganization(id, user.organizationId);
    const existingCandidate = await candidateRepository.findCandidateById(id);

    if (!existingCandidate) {
        throw new AppError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    if (user) {
        if (user.role === "hiring_manager") {
            const hasAccess = existingCandidate.applications.some(app => app.job.department.toLowerCase() === user.department?.toLowerCase());
            if (!hasAccess) throw new AppError("Forbidden: Candidate belongs to a different department", StatusCodes.FORBIDDEN);
        }

        if (user.role === "employee") {
            throw new AppError("Forbidden: Employees cannot update candidate stages", StatusCodes.FORBIDDEN);
        }

        if (user.role === "recruiter") {
            const hasAccess = existingCandidate.applications.some(app => 
                app.job.recruiterId === user.id || 
                app.job.hiringManagerId === user.id || 
                app.job.createdById === user.id ||
                app.job.hiringTeamMembers?.some((m: any) => m.id === user.id)
            );
            if (!hasAccess) throw new AppError("Forbidden: You are not assigned to this candidate's job hiring team", StatusCodes.FORBIDDEN);
        }
    }

    // Find the latest application for this candidate to get the fromStage
    const latestApp = existingCandidate.applications && existingCandidate.applications.length > 0
        ? existingCandidate.applications[0]
        : null;

    const fromStage = latestApp ? latestApp.currentStage : null;
    const applicationId = latestApp ? latestApp.id : null;

    if (fromStage) {
        const currentIndex = STAGES.indexOf(fromStage);
        const newIndex = STAGES.indexOf(stage);
        
        if (fromStage === stage) {
            throw new AppError("Candidate is already in this stage", StatusCodes.BAD_REQUEST);
        }
        if (newIndex < currentIndex) {
            throw new AppError("Candidates can only move forward in the pipeline", StatusCodes.BAD_REQUEST);
        }
    }

    const updatedApplication = await candidateRepository.updateApplicationStageByCandidateId(id, stage);

    // If an application exists and the changedById is provided, log the stage transition
    if (applicationId && changedById) {
        await pipelineService.logStageTransition({
            applicationId,
            fromStage,
            toStage: stage,
            changedById,
        });

        const { logActivity } = await import("../timeline/timeline.service");
        await logActivity({
            type: "CANDIDATE_MOVED",
            actorId: changedById,
            entityType: "Candidate",
            entityId: id,
            description: `Moved candidate from ${fromStage || 'None'} to ${stage}`,
            department: existingCandidate.applications[0]?.job.department,
            metadata: {
                fromStage: fromStage || 'None',
                toStage: stage
            }
        });
    }

    if (stage === "REJECTED" && existingCandidate.referredBy) {
        const referrer = await prisma.user.findUnique({ where: { id: existingCandidate.referredBy } });
        if (referrer) {
            const candidateName = `${existingCandidate.firstName} ${existingCandidate.lastName}`;
            const referrerName = `${referrer.firstName} ${referrer.lastName}`;
            const jobTitle = existingCandidate.applications[0]?.job.title || "the position";
            const { emailService } = await import("../email/email.service");
            emailService.sendCandidateRejectionEmail({ to: existingCandidate.email, candidateName, jobTitle }).catch(console.error);
            emailService.sendReferrerRejectionEmail({ to: referrer.email, referrerName, candidateName, jobTitle }).catch(console.error);

            // In-app notification for the referrer
            const { notifyReferralRejected } = await import("../notifications/notification.service");
            notifyReferralRejected({
                referrerUserId: existingCandidate.referredBy,
                candidateName,
                jobTitle,
                candidateId: id,
            }).catch(console.error);
        }
    }

    // Notify about stage change (fire-and-forget)
    if (changedById) {
        const actor = await prisma.user.findUnique({ where: { id: changedById }, select: { firstName: true, lastName: true } });
        const actorName = actor ? `${actor.firstName} ${actor.lastName}` : "System";
        const candidateName = `${existingCandidate.firstName} ${existingCandidate.lastName}`;
        const jobForNotif = existingCandidate.applications[0]?.job;
        if (jobForNotif) {
            const { notifyCandidateStageChange } = await import("../notifications/notification.service");
            notifyCandidateStageChange({
                candidateId: id,
                candidateName,
                jobId: jobForNotif.id,
                jobTitle: jobForNotif.title,
                jobDepartment: jobForNotif.department,
                fromStage: fromStage || null,
                toStage: stage,
                changedByName: actorName,
            }).catch(console.error);
        }
    }

    return updatedApplication;
};


export const deleteCandidate = async (id: string, organizationId: string) => {
    await assertCandidateInOrganization(id, organizationId);
    const existingCandidate = await candidateRepository.findCandidateById(id);

    if (!existingCandidate) {
        throw new AppError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    await candidateRepository.deleteCandidate(id);

    return;
};

export const getCandidateNotes = async (candidateId: string, organizationId: string) => {
    await assertCandidateInOrganization(candidateId, organizationId);
    const prismaModule = await import("../../database/prisma-client");
    const prisma = prismaModule.default || prismaModule.prisma;
    
    return prisma.note.findMany({
        where: { candidateId },
        include: {
            author: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const addCandidateNote = async (
    candidateId: string,
    authorId: string,
    content: string,
    opinion: string | undefined,
    organizationId: string
) => {
    await assertCandidateInOrganization(candidateId, organizationId);
    const prismaModule = await import("../../database/prisma-client");
    const prisma = prismaModule.default || prismaModule.prisma;
    
    const note = await prisma.note.create({
        data: {
            candidateId,
            authorId,
            content,
            opinion,
        },
        include: {
            author: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true, department: true },
            },
            candidate: {
                include: {
                    applications: {
                        include: {
                            job: {
                                select: { department: true }
                            }
                        }
                    }
                }
            }
        },
    });

    const { logActivity } = await import("../timeline/timeline.service");
    await logActivity({
        type: "NOTE_ADDED",
        actorId: authorId,
        entityType: "Note",
        entityId: note.id,
        description: `Added a note for the candidate`,
        department: note.candidate?.applications?.[0]?.job?.department || note.author?.department,
        metadata: {
            opinion,
            contentPreview: content.substring(0, 100) + (content.length > 100 ? "..." : "")
        }
    });

    return note;
};

export const getCandidateTimeline = async (candidateId: string, organizationId: string) => {
    await assertCandidateInOrganization(candidateId, organizationId);
    const prismaModule = await import("../../database/prisma-client");
    const prisma = prismaModule.default || prismaModule.prisma;
    
    return prisma.activityLog.findMany({
        where: { candidateId },
        include: {
            actor: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};