import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import jobsRepository from "./jobs.repository";
import { Prisma } from "@prisma/client";
import { emailService } from "../email/email.service";
import crypto from "crypto";
import prisma from "../../database/prisma-client";

import { logActivity } from "../timeline/timeline.service";

export const createJob = async (
    data: {
        title: string;
        department: string;
        location: string;
        employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
        experience?: string;
        skills?: string[];
        description: string;
        openings?: number;
        applicationDeadline: Date;
        status?: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
        salaryMin?: number;
        hiringManagerId?: string;
    },
    recruiterId: string
) => {
    const { openings, ...rest } = data;

    const job = await jobsRepository.createJob({
        ...rest,
        numOpenings: openings,
        recruiterId,
        createdById: recruiterId,
    });

    const user = await prisma.user.findUnique({ where: { id: recruiterId } });

    await logActivity({
        type: "JOB_CREATED",
        actorId: recruiterId,
        entityType: "Job",
        entityId: job.id,
        description: `Created new job: ${job.title}`,
        department: user?.department,
    });

    // Notify admins + dept hiring managers (fire-and-forget)
    const { notifyJobCreated } = await import("../notifications/notification.service");
    notifyJobCreated({
        jobId: job.id,
        jobTitle: job.title,
        jobDepartment: job.department,
        createdByName: user ? `${user.firstName} ${user.lastName}` : "System",
    }).catch(console.error);

    return job;
};


export const getAllJobs = async (query: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
    isReferral?: boolean;
}, user: { id: string; role: string; department?: string | null }) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const { search, department, status } = query;

    const where: Prisma.JobWhereInput = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
        ];
    }

    if (department) {
        where.department = { contains: department, mode: "insensitive" };
    }

    if (status) {
        where.status = status;
    }

    const isReferral = query.isReferral === true || String(query.isReferral) === "true";

    if (!isReferral) {
        if (user.role === "hiring_manager") {
            if (user.department) {
                where.department = { equals: user.department, mode: "insensitive" };
            } else {
                where.department = "NONE_ASSIGNED_TO_THIS_USER";
            }
        }

        if (user.role === "recruiter" || user.role === "employee") {
            where.OR = [
                { recruiterId: user.id },
                { hiringManagerId: user.id },
                { createdById: user.id },
                { hiringTeamMembers: { some: { id: user.id } } },
            ];
        }
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [jobs, total] = await Promise.all([
        jobsRepository.findAllJobs({ skip, take, where }),
        jobsRepository.countJobs(where),
    ]);

    return {
        jobs,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getJobById = async (id: string, user: { id: string; role: string; department?: string | null }) => {
    const job = await jobsRepository.findJobById(id);

    if (!job) {
        throw new AppError("Job not found", StatusCodes.NOT_FOUND);
    }

    if (user.role === "hiring_manager") {
        const userDept = user.department?.toLowerCase();
        const jobDept = job.department?.toLowerCase();
        if (userDept !== jobDept) {
            throw new AppError("Forbidden: Job belongs to a different department", StatusCodes.FORBIDDEN);
        }
    }

    if (user.role === "recruiter" || user.role === "employee") {
        const isTeamMember = job.hiringTeamMembers?.some((m: any) => m.id === user.id);
        if (
            job.recruiterId !== user.id &&
            job.hiringManagerId !== user.id &&
            job.createdById !== user.id &&
            !isTeamMember
        ) {
            throw new AppError("Forbidden: You are not assigned to this job's hiring team", StatusCodes.FORBIDDEN);
        }
    }

    return job;
};

export const updateJob = async (
    id: string,
    data: {
        title?: string;
        department?: string;
        location?: string;
        employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
        experience?: string;
        skills?: string[];
        description?: string;
        openings?: number;
        applicationDeadline?: Date;
        status?: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
        salaryMin?: number;
        salaryMax?: number;
    }
) => {
    const existingJob = await jobsRepository.findJobById(id);

    if (!existingJob) {
        throw new AppError("Job not found", StatusCodes.NOT_FOUND);
    }

    const { openings, ...rest } = data;

    const updateData: Prisma.JobUpdateInput = {
        ...rest,
    };

    if (openings !== undefined) {
        updateData.numOpenings = openings;
    }

    const updatedJob = await jobsRepository.updateJob(id, updateData);

    // Notify on update (fire-and-forget)
    const { notifyJobUpdated } = await import("../notifications/notification.service");
    notifyJobUpdated({
        jobId: updatedJob.id,
        jobTitle: updatedJob.title,
        jobDepartment: updatedJob.department,
        updatedByName: "System",
        statusChange: data.status,
    }).catch(console.error);

    return updatedJob;
};


export const deleteJob = async (id: string) => {
    const existingJob = await jobsRepository.findJobById(id);

    if (!existingJob) {
        throw new AppError("Job not found", StatusCodes.NOT_FOUND);
    }

    await jobsRepository.deleteJob(id);

    return;
};

export const inviteToHiringTeam = async (jobId: string, userId: string, inviter: { id: string, name?: string }) => {
    const job = await jobsRepository.findJobById(jobId);
    if (!job) throw new AppError("Job not found", StatusCodes.NOT_FOUND);

    const userToInvite = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToInvite) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    // Check if already in hiring team
    const isTeamMember = job.hiringTeamMembers?.some((m: any) => m.id === userId);
    if (
        isTeamMember ||
        job.recruiterId === userId ||
        job.hiringManagerId === userId ||
        job.createdById === userId
    ) {
        throw new AppError("User is already part of the hiring team", StatusCodes.BAD_REQUEST);
    }

    // Check if pending invitation exists
    let invitation = await prisma.jobInvitation.findUnique({
        where: { jobId_userId: { jobId, userId } },
    });

    if (invitation) {
        if (invitation.status === "PENDING") {
            // Already pending, just resend maybe, but for now throw
            throw new AppError("An invitation is already pending for this user", StatusCodes.BAD_REQUEST);
        }
        if (invitation.status === "ACCEPTED") {
            throw new AppError("User already accepted an invitation to this job", StatusCodes.BAD_REQUEST);
        }
    }

    const token = crypto.randomBytes(32).toString("hex");

    invitation = await prisma.jobInvitation.upsert({
        where: { jobId_userId: { jobId, userId } },
        update: { token, status: "PENDING", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        create: {
            jobId,
            userId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    const inviterRecord = await prisma.user.findUnique({ where: { id: inviter.id } });
    const actualInviterName = inviterRecord ? `${inviterRecord.firstName} ${inviterRecord.lastName}` : "A team member";

    await emailService.sendJobInvitationEmail({
        to: userToInvite.email,
        token,
        jobTitle: job.title,
        inviterName: actualInviterName,
    });

    // Notify the invited user (fire-and-forget)
    const { notifyHiringTeamInvite } = await import("../notifications/notification.service");
    notifyHiringTeamInvite({
        invitedUserId: userId,
        inviterName: actualInviterName,
        jobTitle: job.title,
        jobId,
    }).catch(console.error);

    return invitation;
};


export const acceptHiringTeamInvitation = async (token: string, userId: string) => {
    const invitation = await prisma.jobInvitation.findUnique({
        where: { token },
        include: { job: true },
    });

    if (!invitation) throw new AppError("Invalid invitation token", StatusCodes.BAD_REQUEST);
    if (invitation.userId !== userId) throw new AppError("This invitation is for a different user", StatusCodes.FORBIDDEN);
    if (invitation.status !== "PENDING") throw new AppError("This invitation is no longer pending", StatusCodes.BAD_REQUEST);
    if (invitation.expiresAt < new Date()) throw new AppError("This invitation has expired", StatusCodes.BAD_REQUEST);

    // Accept invitation and add to hiring team
    await prisma.$transaction([
        prisma.jobInvitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED" },
        }),
        prisma.job.update({
            where: { id: invitation.jobId },
            data: {
                hiringTeamMembers: {
                    connect: { id: userId },
                },
            },
        }),
    ]);

    return { jobId: invitation.jobId };
};

export const getEligibleTeamMembers = async (jobId: string) => {
    const job = await jobsRepository.findJobById(jobId);
    if (!job) throw new AppError("Job not found", StatusCodes.NOT_FOUND);

    const existingMemberIds = [
        job.recruiterId,
        job.hiringManagerId,
        job.createdById,
        ...(job.hiringTeamMembers?.map(m => m.id) || []),
        ...(job.jobInvitations?.filter(i => i.status === "PENDING").map(i => i.userId) || [])
    ].filter(Boolean);

    const users = await prisma.user.findMany({
        where: {
            role: { in: ["hiring_manager", "recruiter", "employee"] },
            id: { notIn: existingMemberIds as string[] }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            role: true,
        },
        orderBy: { firstName: 'asc' }
    });

    return users;
};

