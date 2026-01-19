import { Position } from '@/entities/position.entity';
import { PositionResponse } from '@libs/shared/types/positions.type';

export class PositionsMapper {
  static toResponse(position: Position): PositionResponse {
    return {
      id: position.id,
      name: position.name,
      baseSalary: Number(position.baseSalary),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  static toResponseList(positions: Position[]): PositionResponse[] {
    return positions.map((position) => this.toResponse(position));
  }
}

