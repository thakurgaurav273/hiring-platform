import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID as uuidv4 } from "crypto";
import path from "path";
import { IStorageService } from "./storage.interface";

export class S3StorageService implements IStorageService {
    private client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.S3_BUCKET_NAME || "";
        
        this.client = new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
            }
        });
    }

    async uploadFile(buffer: Buffer, originalName: string, mimeType: string, directory: string = "resumes"): Promise<{ fileUrl: string; key: string }> {
        const ext = path.extname(originalName);
        const fileName = `${uuidv4()}${ext}`;
        const key = `${directory}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType
        });

        await this.client.send(command);

        // We return the raw key as the fileUrl to allow dynamic retrieval
        // This key will be used later with getFileUrl()
        return { fileUrl: key, key };
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        await this.client.send(command);
    }

    async getFileUrl(key: string): Promise<string> {
        // Return a presigned URL valid for 1 hour
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        const signedUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
        return signedUrl;
    }
}
