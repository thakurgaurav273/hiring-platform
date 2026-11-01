import { StorageProvider } from "./storage-provider.interface";

/**
 * R2StorageProvider — Placeholder for Cloudflare R2 integration.
 * Requires: npm install @aws-sdk/client-s3 (R2 is S3-compatible)
 *
 * To activate, set the following environment variables:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */
export class R2StorageProvider implements StorageProvider {
    async upload(params: {
        fileName: string;
        fileBuffer: Buffer;
        mimeType: string;
        candidateId: string;
    }): Promise<{ fileUrl: string; storagePath: string }> {
        throw new Error("R2StorageProvider not yet configured. Set R2 environment variables.");
    }

    async delete(storagePath: string): Promise<void> {
        throw new Error("R2StorageProvider not yet configured.");
    }
}
