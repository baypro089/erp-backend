import { PagedResult } from './pagedResult.type';

export type PositionResponse = {
  id: string;
  name: string;
  description?: string;
  baseSalary: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
};

export type CreatePositionDTO = {
  name: string;
  baseSalary: number;
  description?: string;
};

export type UpdatePositionDTO = {
  name?: string;
  baseSalary?: number;
  description?: string;
};

export type PagedAndFilteredPosition = PagedResult<PositionResponse>;
