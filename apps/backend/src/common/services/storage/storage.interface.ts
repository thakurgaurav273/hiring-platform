export interface IStorageService {
    uploadFile(buffer: Buffer, originalName: string, mimeType: string, directory?: string): Promise<{ fileUrl: string; key: string }>;
    deleteFile(key: string): Promise<void>;
    getFileUrl(key: string): Promise<string>;
}
