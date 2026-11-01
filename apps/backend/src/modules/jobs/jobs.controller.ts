import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import * as jobsService from "./jobs.service";

export const createJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const job = await jobsService.createJob(req.body, req.user!.id, req.user!.organizationId);

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Job created successfully",
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const jobs = await jobsService.getAllJobs(req.query, req.user!);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Jobs fetched successfully",
            data: jobs,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Job By Id
 */
export const getJobById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const job = await jobsService.getJobById(
            req.params.id,
            req.user!
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Job fetched successfully",
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update Job
 */
export const updateJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const job = await jobsService.updateJob(req.params.id, req.body, req.user!);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Job updated successfully",
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete Job
 */
export const deleteJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await jobsService.deleteJob(req.params.id, req.user!.organizationId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const inviteToHiringTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const invitation = await jobsService.inviteToHiringTeam(
            req.params.id,
            req.body.userId,
            req.user!
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invitation sent successfully",
            data: invitation,
        });
    } catch (error) {
        next(error);
    }
};

export const acceptHiringTeamInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await jobsService.acceptHiringTeamInvitation(
            req.body.token,
            req.user!.id
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invitation accepted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getEligibleTeamMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users = await jobsService.getEligibleTeamMembers(req.params.id, req.user!.organizationId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Eligible users fetched successfully",
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

const jobsController = {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    inviteToHiringTeam,
    acceptHiringTeamInvitation,
    getEligibleTeamMembers,
};

export default jobsController;