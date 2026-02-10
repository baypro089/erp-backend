
export type SystemSettingResponse = {
    key: string; // Khóa định danh (VD: 'GLOBAL_LUNCH_ALLOWANCE')
    value: string; // Giá trị (Lưu string cho linh hoạt, khi dùng sẽ parse ra number)
    description?: string; // VD: "Phụ cấp ăn trưa toàn công ty 2026"
    isActive: boolean; // Tắt/Bật khoản này
};

export type SystemSettingUpdateDto = {
    value?: string;
    description?: string;
    isActive?: boolean;
}