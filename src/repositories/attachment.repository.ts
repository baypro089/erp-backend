import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Attachment } from '@/entities/attachment.entity';
import { AttachmentType, AttachmentFolder, AttachmentStatus } from '@libs/shared/enums/attachment.enum';

@Injectable()
export class AttachmentRepository extends Repository<Attachment> {
  constructor(private dataSource: DataSource) {
    super(Attachment, dataSource.createEntityManager());
  }

  /**
   * Tìm kiếm attachment với filter và phân trang
   */
  async findAllFilteredAndPaged(
    type?: AttachmentType,
    folder?: AttachmentFolder,
    status?: AttachmentStatus,
    entityType?: string,
    entityId?: string,
    uploadedBy?: string,
    search?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: Attachment[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('attachment');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('attachment.type = :type', { type });
    }

    if (folder) {
      queryBuilder.andWhere('attachment.folder = :folder', { folder });
    }

    if (status) {
      queryBuilder.andWhere('attachment.status = :status', { status });
    } else {
      // Mặc định chỉ lấy active
      queryBuilder.andWhere('attachment.status = :status', {
        status: AttachmentStatus.ACTIVE,
      });
    }

    if (entityType) {
      queryBuilder.andWhere('attachment.entityType = :entityType', {
        entityType,
      });
    }

    if (entityId) {
      queryBuilder.andWhere('attachment.entityId = :entityId', { entityId });
    }

    if (uploadedBy) {
      queryBuilder.andWhere('attachment.uploadedBy = :uploadedBy', {
        uploadedBy,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(unaccent(attachment.originalName) ILIKE unaccent(:search) OR unaccent(attachment.description) ILIKE unaccent(:search))',
        { search: `%${search}%` },
      );
    }

    // Order by created date desc
    queryBuilder.orderBy('attachment.createdAt', 'DESC');

    // Pagination
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  /**
   * Tìm tất cả attachment của một entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Attachment[]> {
    return this.find({
      where: {
        entityType,
        entityId,
        status: AttachmentStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Tìm attachment theo path
   */
  async findByPath(path: string): Promise<Attachment | null> {
    return this.findOne({
      where: { path },
    });
  }

  /**
   * Đếm số lượng attachment của entity
   */
  async countByEntity(entityType: string, entityId: string): Promise<number> {
    return this.count({
      where: {
        entityType,
        entityId,
        status: AttachmentStatus.ACTIVE,
      },
    });
  }

  /**
   * Tính tổng dung lượng attachment của user
   */
  async getTotalSizeByUser(uploadedBy: string): Promise<number> {
    const result = await this.createQueryBuilder('attachment')
      .select('SUM(attachment.size)', 'total')
      .where('attachment.uploadedBy = :uploadedBy', { uploadedBy })
      .andWhere('attachment.status = :status', {
        status: AttachmentStatus.ACTIVE,
      })
      .getRawOne();

    return result?.total ? parseInt(result.total) : 0;
  }
}
