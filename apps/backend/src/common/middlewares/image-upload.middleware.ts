import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error";

/**
 * Image uploads for branding assets (logos, favicons).
 *
 * SVG is intentionally not accepted: it can carry script and would be served
 * from the API origin. Declared MIME types are checked here, and the actual
 * file signature is checked again by `assertImageSignature` once the buffer is
 * available, because the client controls the declared type.
 */
export const BRANDING_IMAGE_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
} as const;

export type BrandingImageMime = keyof typeof BRANDING_IMAGE_TYPES;

/** Hard upper bound for any branding image; per-asset limits are enforced in the service. */
export const MAX_BRANDING_IMAGE_BYTES = 2 * 1024 * 1024;

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BRANDING_IMAGE_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype in BRANDING_IMAGE_TYPES) return cb(null, true);
        cb(
            new AppError(
                `Unsupported image type: ${file.mimetype}. Use PNG, JPEG, WebP or ICO.`,
                StatusCodes.BAD_REQUEST
            )
        );
    },
});

/** Detects the real image type from the file's leading bytes. */
export function detectImageType(buf: Buffer): "png" | "jpg" | "webp" | "ico" | null {
    if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return "png";
    }
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
        return "webp";
    }
    if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return "ico";
    return null;
}

/** Throws unless the buffer's signature matches its declared MIME type. */
export function assertImageSignature(file: Express.Multer.File): "png" | "jpg" | "webp" | "ico" {
    const expected = BRANDING_IMAGE_TYPES[file.mimetype as BrandingImageMime];
    const actual = detectImageType(file.buffer);
    if (!expected || actual !== expected) {
        throw new AppError("File content does not match a supported image type", StatusCodes.BAD_REQUEST);
    }
    return actual;
}
