import { IStorageService } from "./storage.interface";
import { LocalStorageService } from "./local-storage.service";
import { S3StorageService } from "./s3-storage.service";

export class StorageFactory {
    private static instance: IStorageService;

    public static getService(): IStorageService {
        if (!this.instance) {
            const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
            
            if (provider === "s3") {
                this.instance = new S3StorageService();
            } else {
                this.instance = new LocalStorageService();
            }
        }
        return this.instance;
    }
}
