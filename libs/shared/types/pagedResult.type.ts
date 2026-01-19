type PagedResult<T> = {
    items: T[];     // Mảng phần tử trả về

    totalCount: number;     // Số lượng tất cả phần tử có trên database . Ví dụ database có toàn bộ 100 phần tử thì là 100

    page: number; // Số trang . Ví dụ muốn lấy trang 2 thì page là 2

    pageSize: number; // Số lượng phần tử trong 1 trang . Ví dụ 1 trang muốn có 10 phần tử thì là 10

    totalPages: number; // Số trang tối đa có thể có . Ví dụ 100 phần tử chia ra mỗi trang 10 phần tử thì nghĩa là tối đa 10 trang

    hasPreviousPage: boolean; // Kiểm tra có trang trước đó không 

    hasNextPage: boolean; // Kiểm tra có trang tiếp theo không 
};

type PagedParams = {
    page?: number;
    pageSize?: number;
}

export type { PagedResult, PagedParams }