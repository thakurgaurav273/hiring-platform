import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma-client";

const createJob = async (data: Prisma.JobUncheckedCreateInput) => {
    return prisma.job.create({
        data,
        include: {
            recruiter: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            },
            hiringManager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringTeamMembers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    department: true,
                },
            },
            jobInvitations: {
                where: { status: "PENDING" },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            department: true,
                        }
                    }
                }
            },
            _count: {
                select: { applications: true },
            },
        },
    });
};

const findJobById = async (id: string) => {
    return prisma.job.findUnique({
        where: { id },
        include: {
            recruiter: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringManager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringTeamMembers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    department: true,
                },
            },
            jobInvitations: {
                where: { status: "PENDING" },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            department: true,
                        }
                    }
                }
            },
            _count: {
                select: { applications: true },
            },
        },
    });
};

const findAllJobs = async (params: {
    skip: number;
    take: number;
    where: Prisma.JobWhereInput;
}) => {
    const { skip, take, where } = params;
    return prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            recruiter: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringManager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringTeamMembers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    department: true,
                },
            },
            jobInvitations: {
                where: { status: "PENDING" },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            department: true,
                        }
                    }
                }
            },
            _count: {
                select: { applications: true },
            },
        },
    });
};

const countJobs = async (where: Prisma.JobWhereInput) => {
    return prisma.job.count({
        where,
    });
};

const updateJob = async (id: string, data: Prisma.JobUpdateInput) => {
    return prisma.job.update({
        where: { id },
        data,
        include: {
            recruiter: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringManager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            hiringTeamMembers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    department: true,
                },
            },
            jobInvitations: {
                where: { status: "PENDING" },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            department: true,
                        }
                    }
                }
            },
            _count: {
                select: { applications: true },
            },
        },
    });
};

const deleteJob = async (id: string) => {
    return prisma.job.delete({
        where: { id },
    });
};

const jobsRepository = {
    createJob,
    findJobById,
    findAllJobs,
    countJobs,
    updateJob,
    deleteJob,
};

export default jobsRepository;
