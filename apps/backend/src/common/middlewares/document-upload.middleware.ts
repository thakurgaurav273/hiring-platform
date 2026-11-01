import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error";

/**
 * Résumé uploads from the public application form. Only PDF, DOC and DOCX;
 * the declared type is checked here and the real file signature is checked
 * with assertDocumentSignature once the buffer is available.
 */
const DOCUMENT_TYPES = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 60, fieldSize: 20 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype in DOCUMENT_TYPES) return cb(null, true);
        cb(new AppError("Résumé must be a PDF, DOC or DOCX file", StatusCodes.BAD_REQUEST));
    },
});

export function detectDocumentType(buf: Buffer): "pdf" | "doc" | "docx" | null {
    if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
    // OLE2 compound document (legacy .doc)
    if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "doc";
    // ZIP container with a Word document part (.docx)
    if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) {
        return buf.includes(Buffer.from("word/")) ? "docx" : null;
    }
    return null;
}

/** Throws unless the file content matches its declared document type. */
export function assertDocumentSignature(file: Express.Multer.File) {
    const expected = DOCUMENT_TYPES[file.mimetype as keyof typeof DOCUMENT_TYPES];
    const actual = detectDocumentType(file.buffer);
    if (!expected || actual !== expected) {
        throw new AppError("The résumé file appears to be damaged or is not a real PDF/Word document", StatusCodes.BAD_REQUEST);
    }
}
