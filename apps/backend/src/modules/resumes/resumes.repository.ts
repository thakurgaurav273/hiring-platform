import prisma from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

const createResume = async (data: Prisma.ResumeUncheckedCreateInput) => {
    return prisma.resume.create({
        data,
    });
};

const findResumeById = async (id: string) => {
    return prisma.resume.findUnique({
        where: { id },
        include: {
            candidate: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
        },
    });
};

const findResumesByCandidateId = async (candidateId: string) => {
    return prisma.resume.findMany({
        where: { candidateId },
        orderBy: { uploadedAt: "desc" },
    });
};

const deleteResume = async (id: string) => {
    return prisma.resume.delete({ where: { id } });
};

const setActiveResume = async (candidateId: string, resumeId: string) => {
    // Deactivate all resumes for this candidate
    await prisma.resume.updateMany({
        where: { candidateId },
        data: { isActive: false },
    });
    // Activate the specified one
    return prisma.resume.update({
        where: { id: resumeId },
        data: { isActive: true },
    });
};

const resumesRepository = {
    createResume,
    findResumeById,
    findResumesByCandidateId,
    deleteResume,
    setActiveResume,
};

export default resumesRepository;
