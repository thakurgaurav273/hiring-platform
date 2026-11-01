import multer from "multer";
import path from "path";
import { randomUUID as uuidv4 } from "crypto";
import { AppError } from "../errors/app-error";
import { StatusCodes } from "http-status-codes";

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                `Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, PNG, JPEG`,
                StatusCodes.BAD_REQUEST
            )
        );
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
