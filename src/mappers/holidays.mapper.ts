import { Holiday } from "@/entities/holiday.entity";
import { HolidayResponse } from "@libs/shared/types/holiday.type";

export class HolidayMapper {
    static toResponse(holiday: Holiday): HolidayResponse {
        return {
            id: holiday.id,
            name: holiday.name,
            date: holiday.date,
            description: holiday.description,
        };
    }

    static toResponseList(holidays: Holiday[]): HolidayResponse[] {
        return holidays.map((holiday) => this.toResponse(holiday));
    }
}