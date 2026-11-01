import { PipelineStage, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import pipelineRepository from "./pipeline.repository";

const DEFAULT_STAGES = [
    { stage: PipelineStage.APPLIED, order: 1, label: "applied" },
    { stage: PipelineStage.SCREENING, order: 2, label: "screening" },
    { stage: PipelineStage.SHORTLISTED, order: 3, label: "shortlisted" },
    { stage: PipelineStage.INTERVIEW_SCHEDULED, order: 4, label: "interview_scheduled" },
    { stage: PipelineStage.INTERVIEW_COMPLETED, order: 5, label: "interview_completed" },
    { stage: PipelineStage.TECHNICAL_ROUND, order: 6, label: "technical_round" },
    { stage: PipelineStage.HR_ROUND, order: 7, label: "hr_round" },
    { stage: PipelineStage.OFFER_SENT, order: 8, label: "offer_sent" },
    { stage: PipelineStage.HIRED, order: 9, label: "hired" },
    { stage: PipelineStage.REJECTED, order: 10, label: "rejected" },
];

export const createTemplate = async (data: {
    name: string;
    jobId?: string;
    isDefault?: boolean;
    stages: { stage: PipelineStage; order: number; label?: string }[];
}) => {
    return pipelineRepository.createTemplate(data);
};

export const getTemplateById = async (id: string) => {
    const template = await pipelineRepository.findTemplateById(id);
    if (!template) {
        throw new AppError("Pipeline template not found", StatusCodes.NOT_FOUND);
    }
    return template;
};

export const getTemplateByJobId = async (jobId: string) => {
    const template = await pipelineRepository.findTemplateByJobId(jobId);
    if (template) return template;

    const defaultTemplate = await pipelineRepository.findDefaultTemplate();
    if (defaultTemplate) return defaultTemplate;

    // Auto-create a default template if none exists in the DB
    return pipelineRepository.createTemplate({
        name: "Default Pipeline",
        isDefault: true,
        stages: DEFAULT_STAGES,
    });
};

export const getAllTemplates = async () => {
    return pipelineRepository.findAllTemplates();
};

export const updateTemplate = async (
    id: string,
    data: {
        name?: string;
        jobId?: string;
        isDefault?: boolean;
        stages?: { stage: PipelineStage; order: number; label?: string }[];
    }
) => {
    const template = await pipelineRepository.findTemplateById(id);
    if (!template) {
        throw new AppError("Pipeline template not found", StatusCodes.NOT_FOUND);
    }
    return pipelineRepository.updateTemplate(id, data);
};

export const deleteTemplate = async (id: string) => {
    const template = await pipelineRepository.findTemplateById(id);
    if (!template) {
        throw new AppError("Pipeline template not found", StatusCodes.NOT_FOUND);
    }
    await pipelineRepository.deleteTemplate(id);
    return;
};

export const logStageTransition = async (data: {
    applicationId: string;
    fromStage: PipelineStage | null;
    toStage: PipelineStage;
    changedById: string;
    notes?: string;
}) => {
    return pipelineRepository.createHistory(data);
};

export const getHistoryForApplication = async (applicationId: string) => {
    return pipelineRepository.findHistoryByApplicationId(applicationId);
};
