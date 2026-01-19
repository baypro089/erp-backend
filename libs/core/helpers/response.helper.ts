import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";

export class ResponseHelper {
  static send<T>(data: T, message?: string): ApiResponse<T> {
    return {
      message,
      data
    };
  }
}