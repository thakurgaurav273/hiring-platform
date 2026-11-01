import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import interviewsRepository from "./interviews.repository";
import { Prisma } from "@prisma/client";

export const createInterview = async (
    data: {
        applicationId: string;
        type: "SCREENING" | "TECHNICAL" | "HR" | "MANAGERIAL" | "FINAL";
        scheduledAt: Date;
        durationMins?: number;
        location?: string;
        meetingLink?: string;
    },
    interviewerIds: string[],
    user?: { id: string; role: string; department?: string | null }
) => {
    const interview = await interviewsRepository.createInterview(data, interviewerIds);

    if (user) {
        const { logActivity } = await import("../timeline/timeline.service");
        await logActivity({
            type: "INTERVIEW_SCHEDULED",
            actorId: user.id,
            entityType: "Interview",
            entityId: interview.id,
            description: `Scheduled a ${data.type} interview`,
            department: interview.application.job.department,
            metadata: {
                interviewType: data.type,
                scheduledAt: data.scheduledAt,
                durationMins: data.durationMins,
                location: data.location,
                interviewerIds,
            }
        });
    }

    // Notify interviewers + admins + dept HMs (fire-and-forget)
    const schedulerName = user ? await import("../../database/prisma-client").then(m => (m.default || m.prisma).user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } })).then(u => u ? `${u.firstName} ${u.lastName}` : "System") : "System";
    const { notifyInterviewScheduled } = await import("../notifications/notification.service");
    notifyInterviewScheduled({
        interviewId: interview.id,
        candidateName: `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
        jobTitle: interview.application.job.title,
        jobDepartment: interview.application.job.department,
        jobId: interview.application.jobId,
        scheduledAt: data.scheduledAt,
        interviewType: data.type,
        panelistIds: interviewerIds,
        scheduledByName: schedulerName,
    }).catch(console.error);

    return interview;
};


export const getInterviews = async (
    query: {
        page?: number;
        limit?: number;
        status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
        orderBy?: "asc" | "desc";
    },
    user: { id: string; role: string; department?: string | null; organizationId: string }
) => {
    // Auto-complete past scheduled interviews before fetching
    await interviewsRepository.autoCompleteInterviews();

    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;

    // Tenant isolation; role rules below narrow further.
    const where: Prisma.InterviewWhereInput = { AND: [{ application: { job: { organizationId: user.organizationId } } }] };

    if (query.status) {
        where.status = query.status;
    }

    if (user.role === "hiring_manager") {
        if (user.department) {
            where.application = {
                job: {
                    department: { equals: user.department, mode: "insensitive" }
                }
            };
        } else {
            where.application = { job: { department: "NONE_ASSIGNED_TO_THIS_USER" } };
        }
    } else if (user.role === "recruiter" || user.role === "employee") {
        where.panelists = { some: { interviewerId: user.id } };
    }

    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy: Prisma.InterviewOrderByWithRelationInput = {
        scheduledAt: query.orderBy === "asc" ? "asc" : "desc",
    };

    const [interviews, total] = await Promise.all([
        interviewsRepository.findAllInterviews({ skip, take, where, orderBy }),
        interviewsRepository.countInterviews(where),
    ]);

    return {
        interviews,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getInterviewById = async (id: string) => {
    await interviewsRepository.autoCompleteInterviews();
    const interview = await interviewsRepository.findInterviewById(id);
    if (!interview) {
        throw new AppError("Interview not found", StatusCodes.NOT_FOUND);
    }
    return interview;
};

export const updateInterview = async (
    id: string,
    data: {
        status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
        type?: "SCREENING" | "TECHNICAL" | "HR" | "MANAGERIAL" | "FINAL";
        scheduledAt?: Date;
        durationMins?: number;
        location?: string;
        meetingLink?: string;
    },
    interviewerIds?: string[],
    user?: { id: string; role: string; department?: string | null }
) => {
    const existing = await interviewsRepository.findInterviewById(id);
    if (!existing) {
        throw new AppError("Interview not found", StatusCodes.NOT_FOUND);
    }

    if (user && user.role === "hiring_manager") {
        if (!user.department || existing.application.job.department?.toLowerCase() !== user.department.toLowerCase()) {
            throw new AppError("Forbidden: Cannot edit interview for a job outside your department", StatusCodes.FORBIDDEN);
        }
    }

    const updated = await interviewsRepository.updateInterview(id, data, interviewerIds);

    if (user) {
        const { logActivity } = await import("../timeline/timeline.service");
        
        let actionDesc = "Updated interview details";
        if (data.status) {
            actionDesc = `Marked interview as ${data.status}`;
        }

        await logActivity({
            type: "INTERVIEW_UPDATED",
            actorId: user.id,
            entityType: "Interview",
            entityId: id,
            description: actionDesc,
            department: existing.application.job.department,
            metadata: {
                status: data.status,
                interviewType: data.type,
                scheduledAt: data.scheduledAt,
                durationMins: data.durationMins,
                location: data.location,
            }
        });
    }

    // Notify about reschedule/update (fire-and-forget)
    const updaterName = user ? await import("../../database/prisma-client").then(m => (m.default || m.prisma).user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } })).then(u => u ? `${u.firstName} ${u.lastName}` : "System") : "System";
    const panelistIds = updated.panelists?.map((p: any) => p.interviewerId) || [];
    const { notifyInterviewUpdated } = await import("../notifications/notification.service");
    notifyInterviewUpdated({
        interviewId: id,
        candidateName: `${existing.application.candidate.firstName} ${existing.application.candidate.lastName}`,
        jobTitle: existing.application.job.title,
        jobDepartment: existing.application.job.department,
        panelistIds,
        updatedByName: updaterName,
        isRescheduled: data.status === "RESCHEDULED" || !!data.scheduledAt,
        scheduledAt: data.scheduledAt,
    }).catch(console.error);

    return updated;
};

