import { Prisma, PipelineStage } from "@prisma/client";
import prisma from "../../database/prisma-client";

const createTemplate = async (data: {
    name: string;
    jobId?: string;
    isDefault?: boolean;
    stages: { stage: PipelineStage; order: number; label?: string }[];
}) => {
    const { stages, ...templateData } = data;

    // If isDefault is true, unset other defaults
    if (templateData.isDefault) {
        await prisma.pipelineTemplate.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }

    return prisma.pipelineTemplate.create({
        data: {
            ...templateData,
            stages: {
                create: stages.map((s) => ({
                    stage: s.stage,
                    order: s.order,
                    label: s.label,
                })),
            },
        },
        include: {
            stages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });
};

const findTemplateById = async (id: string) => {
    return prisma.pipelineTemplate.findUnique({
        where: { id },
        include: {
            stages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });
};

const findTemplateByJobId = async (jobId: string) => {
    return prisma.pipelineTemplate.findUnique({
        where: { jobId },
        include: {
            stages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });
};

const findDefaultTemplate = async () => {
    return prisma.pipelineTemplate.findFirst({
        where: { isDefault: true },
        include: {
            stages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });
};

const findAllTemplates = async () => {
    return prisma.pipelineTemplate.findMany({
        include: {
            stages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });
};

const updateTemplate = async (
    id: string,
    data: {
        name?: string;
        jobId?: string;
        isDefault?: boolean;
        stages?: { stage: PipelineStage; order: number; label?: string }[];
    }
) => {
    const { stages, ...templateData } = data;

    if (templateData.isDefault) {
        await prisma.pipelineTemplate.updateMany({
            where: {
                id: { not: id },
                isDefault: true,
            },
            data: { isDefault: false },
        });
    }

    return prisma.$transaction(async (tx) => {
        // If stages are updated, clear existing ones first
        if (stages) {
            await tx.pipelineStageDefinition.deleteMany({
                where: { templateId: id },
            });
        }

        return tx.pipelineTemplate.update({
            where: { id },
            data: {
                ...templateData,
                stages: stages
                    ? {
                          create: stages.map((s) => ({
                              stage: s.stage,
                              order: s.order,
                              label: s.label,
                          })),
                      }
                    : undefined,
            },
            include: {
                stages: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });
    });
};

const deleteTemplate = async (id: string) => {
    return prisma.pipelineTemplate.delete({
        where: { id },
    });
};

const createHistory = async (data: Prisma.PipelineHistoryUncheckedCreateInput) => {
    return prisma.pipelineHistory.create({
        data,
        include: {
            changedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const findHistoryByApplicationId = async (applicationId: string) => {
    return prisma.pipelineHistory.findMany({
        where: { applicationId },
        include: {
            changedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

const pipelineRepository = {
    createTemplate,
    findTemplateById,
    findTemplateByJobId,
    findDefaultTemplate,
    findAllTemplates,
    updateTemplate,
    deleteTemplate,
    createHistory,
    findHistoryByApplicationId,
};

export default pipelineRepository;
