import * as tenant from "../../common/tenant/tenant-guards";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as pipelineService from "./pipeline.service";

export const createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const template = await pipelineService.createTemplate(req.body);

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Pipeline template created successfully",
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const template = await pipelineService.getTemplateById(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline template fetched successfully",
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const getTemplateByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const template = await pipelineService.getTemplateByJobId(req.params.jobId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline template fetched successfully for job",
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const templates = await pipelineService.getAllTemplates();

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline templates fetched successfully",
            data: templates,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const template = await pipelineService.updateTemplate(req.params.id, req.body);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline template updated successfully",
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await pipelineService.deleteTemplate(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline template deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const getHistoryForApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertApplicationInOrg(req.params.applicationId, req.user!.organizationId);
        const history = await pipelineService.getHistoryForApplication(req.params.applicationId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Pipeline history fetched successfully",
            data: history,
        });
    } catch (error) {
        next(error);
    }
};

const pipelineController = {
    createTemplate,
    getTemplateById,
    getTemplateByJobId,
    getAllTemplates,
    updateTemplate,
    deleteTemplate,
    getHistoryForApplication,
};

export default pipelineController;
