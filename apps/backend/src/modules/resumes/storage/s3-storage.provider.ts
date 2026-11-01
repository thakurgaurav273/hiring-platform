import { StorageProvider } from "./storage-provider.interface";

/**
 * S3StorageProvider — Placeholder for AWS S3 integration.
 * Requires: npm install @aws-sdk/client-s3
 *
 * To activate, set the following environment variables:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
 */
export class S3StorageProvider implements StorageProvider {
    async upload(params: {
        fileName: string;
        fileBuffer: Buffer;
        mimeType: string;
        candidateId: string;
    }): Promise<{ fileUrl: string; storagePath: string }> {
        throw new Error("S3StorageProvider not yet configured. Install @aws-sdk/client-s3 and set AWS environment variables.");
    }

    async delete(storagePath: string): Promise<void> {
        throw new Error("S3StorageProvider not yet configured.");
    }
}
