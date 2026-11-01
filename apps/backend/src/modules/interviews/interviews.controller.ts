import * as tenant from "../../common/tenant/tenant-guards";
import { Request, Response, NextFunction } from "express";
import * as interviewsService from "./interviews.service";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

const createInterviewSchema = z.object({
    applicationId: z.string().uuid(),
    type: z.enum(["SCREENING", "TECHNICAL", "HR", "MANAGERIAL", "FINAL"]),
    scheduledAt: z.string().datetime(),
    durationMins: z.number().int().positive().optional(),
    location: z.string().optional(),
    meetingLink: z.string().url().optional(),
    interviewerIds: z.array(z.string().uuid()).min(1),
});

export const createInterview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsedBody = createInterviewSchema.parse(req.body);
        const { interviewerIds, ...data } = parsedBody;

        await tenant.assertApplicationInOrg(req.body.applicationId, req.user!.organizationId);

        await tenant.assertUsersInOrg(req.body.interviewerIds ?? [], req.user!.organizationId);

        const interview = await interviewsService.createInterview({
            ...data,
            scheduledAt: new Date(data.scheduledAt)
        }, interviewerIds, req.user);

        res.status(StatusCodes.CREATED).json(interview);
    } catch (error) {
        next(error);
    }
};

export const getInterviews = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page, limit, status, orderBy } = req.query;
        const result = await interviewsService.getInterviews(
            {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                status: status as any,
                orderBy: orderBy as any,
            },
            req.user!
        );
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const getInterviewById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        await tenant.assertInterviewInOrg(id, req.user!.organizationId);
        const interview = await interviewsService.getInterviewById(id);
        res.status(StatusCodes.OK).json(interview);
    } catch (error) {
        next(error);
    }
};

export const updateInterview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const updateSchema = z.object({
            status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
            type: z.enum(["SCREENING", "TECHNICAL", "HR", "MANAGERIAL", "FINAL"]).optional(),
            scheduledAt: z.string().datetime().optional(),
            durationMins: z.number().int().positive().optional(),
            location: z.string().optional(),
            meetingLink: z.string().url().optional(),
            interviewerIds: z.array(z.string().uuid()).min(1).optional(),
        });
        
        const parsedBody = updateSchema.parse(req.body);
        const { interviewerIds, ...data } = parsedBody;
        
        await tenant.assertInterviewInOrg(id, req.user!.organizationId);
        
        await tenant.assertUsersInOrg(req.body.interviewerIds ?? [], req.user!.organizationId);
        
        const updated = await interviewsService.updateInterview(id, {
            ...data,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
        }, interviewerIds, req.user);

        res.status(StatusCodes.OK).json(updated);
    } catch (error) {
        next(error);
    }
};
