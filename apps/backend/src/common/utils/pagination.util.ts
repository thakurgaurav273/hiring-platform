export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

export const paginate = (page: number, limit: number) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;
    return { skip, take: safeLimit };
};

export const buildPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
