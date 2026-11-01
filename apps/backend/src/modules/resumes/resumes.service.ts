import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import resumesRepository from "./resumes.repository";
import { StorageFactory } from "../../common/services/storage/storage.factory";

export const uploadResume = async (
    candidateId: string,
    file: Express.Multer.File
) => {
    const storageService = StorageFactory.getService();
    const { key } = await storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "resumes"
    );

    const providerStr = (process.env.STORAGE_PROVIDER || "local").toUpperCase();

    return resumesRepository.createResume({
        candidateId,
        fileName: file.originalname,
        fileUrl: key,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageProvider: providerStr as any,
        isActive: true,
    });
};

export const getResumeById = async (id: string) => {
    const resume = await resumesRepository.findResumeById(id);
    if (!resume) {
        throw new AppError("Resume not found", StatusCodes.NOT_FOUND);
    }
    const storageService = StorageFactory.getService();
    const downloadUrl = await storageService.getFileUrl(resume.fileUrl);
    return { ...resume, downloadUrl };
};

export const getResumesByCandidateId = async (candidateId: string) => {
    const resumes = await resumesRepository.findResumesByCandidateId(candidateId);
    const storageService = StorageFactory.getService();
    
    return Promise.all(resumes.map(async (resume) => {
        const downloadUrl = await storageService.getFileUrl(resume.fileUrl);
        return { ...resume, downloadUrl };
    }));
};

export const deleteResume = async (id: string) => {
    const resume = await resumesRepository.findResumeById(id);
    if (!resume) {
        throw new AppError("Resume not found", StatusCodes.NOT_FOUND);
    }
    
    const storageService = StorageFactory.getService();
    await storageService.deleteFile(resume.fileUrl);
    
    await resumesRepository.deleteResume(id);
    return;
};
