import prisma from "../../database/prisma-client";
import { Prisma, PipelineStage } from "@prisma/client";

const createCandidateWithApplication = async (
    candidateData: Omit<Prisma.CandidateCreateInput, "applications" | "notes">,
    jobId: string,
    stage?: PipelineStage,
    whySuggest?: string,
    authorId?: string
) => {
    return prisma.candidate.create({
        data: {
            ...candidateData,
            applications: {
                create: {
                    jobId,
                    currentStage: stage || "APPLIED",
                },
            },
            notes: whySuggest && authorId ? {
                create: {
                    content: whySuggest,
                    authorId,
                }
            } : undefined,
        },
        include: {
            applications: {
                include: {
                    job: true,
                },
            },
            notes: true,
        },
    });
};

const createApplication = async (
    candidateId: string,
    jobId: string,
    stage?: PipelineStage
) => {
    return prisma.application.create({
        data: {
            candidateId,
            jobId,
            currentStage: stage || "APPLIED",
        },
        include: {
            candidate: true,
            job: true,
        },
    });
};

const findCandidateByEmail = async (email: string) => {
    return prisma.candidate.findUnique({
        where: { email },
    });
};

const findApplication = async (candidateId: string, jobId: string) => {
    return prisma.application.findUnique({
        where: {
            candidateId_jobId: {
                candidateId,
                jobId,
            },
        },
    });
};

const findCandidateById = async (id: string) => {
    return prisma.candidate.findUnique({
        where: { id },
        include: {
            applications: {
                include: {
                    job: {
                        include: {
                            hiringTeamMembers: {
                                select: { id: true, firstName: true, lastName: true, role: true, email: true }
                            },
                            hiringManager: {
                                select: { id: true, firstName: true, lastName: true, role: true, email: true }
                            },
                            recruiter: {
                                select: { id: true, firstName: true, lastName: true, role: true, email: true }
                            },
                            createdBy: {
                                select: { id: true, firstName: true, lastName: true, role: true, email: true }
                            }
                        }
                    },
                    interviews: {
                        orderBy: { scheduledAt: "asc" },
                        include: {
                            panelists: {
                                include: {
                                    interviewer: {
                                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        },
    });
};

const findAllApplications = async (params: {
    skip: number;
    take: number;
    where: Prisma.ApplicationWhereInput;
}) => {
    const { skip, take, where } = params;
    return prisma.application.findMany({
        skip,
        take,
        where,
        include: {
            candidate: true,
            job: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

const countApplications = async (where: Prisma.ApplicationWhereInput) => {
    return prisma.application.count({
        where,
    });
};

const updateCandidate = async (id: string, data: Prisma.CandidateUpdateInput) => {
    return prisma.candidate.update({
        where: { id },
        data,
        include: {
            applications: {
                include: {
                    job: true,
                },
            },
        },
    });
};

const updateApplicationStageByCandidateId = async (
    candidateId: string,
    stage: PipelineStage
) => {
    const latestApp = await prisma.application.findFirst({
        where: { candidateId },
        orderBy: { createdAt: "desc" },
    });
    
    if (!latestApp) {
        throw new Error("No application found for this candidate");
    }

    return prisma.application.update({
        where: { id: latestApp.id },
        data: { currentStage: stage },
        include: {
            candidate: true,
            job: true,
        },
    });
};

const deleteCandidate = async (id: string) => {
    return prisma.candidate.delete({
        where: { id },
    });
};

const candidateRepository = {
    createCandidateWithApplication,
    createApplication,
    findCandidateByEmail,
    findApplication,
    findCandidateById,
    findAllApplications,
    countApplications,
    updateCandidate,
    updateApplicationStageByCandidateId,
    deleteCandidate,
};

export default candidateRepository;