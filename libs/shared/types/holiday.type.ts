type HolidayResponse = {
    id: number;
    name: string;
    date: Date; // 'YYYY-MM-DD'
    description?: string;
}

type CreateHolidayDto = {
    name: string;
    date: Date; // 'YYYY-MM-DD'
    description?: string;
}

export type { HolidayResponse, CreateHolidayDto };