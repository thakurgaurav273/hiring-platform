import { StorageProvider } from "./storage-provider.interface";
import * as fs from "fs";
import * as path from "path";
import { randomUUID as uuidv4 } from "crypto";

export class LocalStorageProvider implements StorageProvider {
    private uploadDir: string;

    constructor(uploadDir?: string) {
        this.uploadDir = uploadDir || path.join(process.cwd(), "uploads");
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async upload(params: {
        fileName: string;
        fileBuffer: Buffer;
        mimeType: string;
        candidateId: string;
    }): Promise<{ fileUrl: string; storagePath: string }> {
        const { fileName, fileBuffer } = params;
        const ext = path.extname(fileName);
        const uniqueName = `${uuidv4()}${ext}`;
        const storagePath = path.join(this.uploadDir, uniqueName);

        fs.writeFileSync(storagePath, fileBuffer);

        const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
        const fileUrl = `${baseUrl}/uploads/${uniqueName}`;

        return { fileUrl, storagePath: uniqueName };
    }

    async delete(storagePath: string): Promise<void> {
        const fullPath = path.join(this.uploadDir, storagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
}
