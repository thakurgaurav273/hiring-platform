export interface StorageProvider {
    upload(params: {
        fileName: string;
        fileBuffer: Buffer;
        mimeType: string;
        candidateId: string;
    }): Promise<{ fileUrl: string; storagePath: string }>;

    delete(storagePath: string): Promise<void>;
}
