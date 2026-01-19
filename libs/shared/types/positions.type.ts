import { PagedResponse } from '@libs/core/interfaces/apiResponse.interface';

export type PositionResponse = {
  id: string;
  name: string;
  baseSalary: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PositionResponseList = {
  items: PositionResponse[];
  total: number;
};

export type PagedAndFilteredPosition = PagedResponse<PositionResponse>;
