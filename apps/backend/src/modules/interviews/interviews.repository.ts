import prisma from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

const createInterview = async (
    data: Prisma.InterviewUncheckedCreateInput,
    interviewerIds: string[]
) => {
    return prisma.interview.create({
        data: {
            ...data,
            panelists: {
                create: interviewerIds.map((id) => ({ interviewerId: id })),
            },
        },
        include: {
            panelists: {
                include: {
                    interviewer: {
                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                    }
                }
            },
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
                    job: { select: { id: true, title: true, department: true } }
                }
            }
        },
    });
};

const findInterviewById = async (id: string) => {
    return prisma.interview.findUnique({
        where: { id },
        include: {
            panelists: {
                include: {
                    interviewer: {
                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                    }
                }
            },
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
                    job: { select: { id: true, title: true, department: true } }
                }
            },
            feedbacks: { select: { id: true, interviewerId: true, rating: true, recommendation: true } },
        },
    });
};

const findAllInterviews = async (params: {
    skip: number;
    take: number;
    where: Prisma.InterviewWhereInput;
    orderBy?: Prisma.InterviewOrderByWithRelationInput | Prisma.InterviewOrderByWithRelationInput[];
}) => {
    const { skip, take, where, orderBy } = params;
    return prisma.interview.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || {
            scheduledAt: "desc",
        },
        include: {
            panelists: {
                include: {
                    interviewer: {
                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                    }
                }
            },
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
                    job: { select: { id: true, title: true, department: true } }
                }
            },
            // Summary only; comments are read on the candidate profile.
            feedbacks: { select: { id: true, interviewerId: true, rating: true, recommendation: true } },
        },
    });
};

const countInterviews = async (where: Prisma.InterviewWhereInput) => {
    return prisma.interview.count({ where });
};

const autoCompleteInterviews = async () => {
    return prisma.interview.updateMany({
        where: {
            status: "SCHEDULED",
            scheduledAt: {
                lt: new Date(),
            },
        },
        data: {
            status: "COMPLETED",
        },
    });
};

const updateInterview = async (
    id: string, 
    data: Prisma.InterviewUpdateInput,
    interviewerIds?: string[]
) => {
    return prisma.interview.update({
        where: { id },
        data: {
            ...data,
            ...(interviewerIds ? {
                panelists: {
                    deleteMany: {},
                    create: interviewerIds.map((interviewerId) => ({ interviewerId })),
                }
            } : {})
        },
        include: {
            panelists: {
                include: {
                    interviewer: {
                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                    }
                }
            },
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
                    job: { select: { id: true, title: true, department: true } }
                }
            }
        },
    });
};

const deleteInterview = async (id: string) => {
    return prisma.interview.delete({
        where: { id },
    });
};

const interviewsRepository = {
    createInterview,
    findInterviewById,
    findAllInterviews,
    countInterviews,
    autoCompleteInterviews,
    updateInterview,
    deleteInterview,
};

export default interviewsRepository;
