import { CustomerTier } from '@libs/shared/enums/customer-tier.enum';
import { PagedResult } from './pagedResult.type';

export type CustomerResponse = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  tier: CustomerTier;
  totalSpent: number;
  rewardPoints: number;
  note?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerTableResponse = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  tier: CustomerTier;
  totalSpent: number;
}

export type CustomerListResponse = PagedResult<CustomerTableResponse>;

export type CreateCustomerDto = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  note?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto> & {
  tier?: CustomerTier;
  isActive?: boolean;
};