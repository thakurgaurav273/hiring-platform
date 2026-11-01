export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
    findById(id: string): Promise<T | null>;
    findAll(params: { skip: number; take: number; where?: WhereInput }): Promise<T[]>;
    count(where?: WhereInput): Promise<number>;
    create(data: CreateInput): Promise<T>;
    update(id: string, data: UpdateInput): Promise<T>;
    delete(id: string): Promise<void>;
}
