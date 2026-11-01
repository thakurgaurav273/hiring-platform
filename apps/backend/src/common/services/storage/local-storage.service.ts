import fs from "fs";
import path from "path";
import { randomUUID as uuidv4 } from "crypto";
import { IStorageService } from "./storage.interface";

export class LocalStorageService implements IStorageService {
    private readonly baseDir: string;

    constructor() {
        this.baseDir = process.env.LOCAL_STORAGE_DIR || "./uploads";
        
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async uploadFile(buffer: Buffer, originalName: string, mimeType: string, directory: string = "resumes"): Promise<{ fileUrl: string; key: string }> {
        const ext = path.extname(originalName);
        const fileName = `${uuidv4()}${ext}`;
        
        const targetDir = path.join(this.baseDir, directory);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, fileName);
        await fs.promises.writeFile(filePath, buffer);

        // For local storage, key is the relative path
        const key = `${directory}/${fileName}`;
        // fileUrl is the static serving path (e.g. /uploads/resumes/...)
        const fileUrl = `/uploads/${key}`;

        return { fileUrl, key };
    }

    async deleteFile(key: string): Promise<void> {
        const filePath = path.join(this.baseDir, key);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    async getFileUrl(key: string): Promise<string> {
        // Return the static local URL with full origin so frontend can download it
        const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        return `${baseUrl}/uploads/${key}`;
    }
}
