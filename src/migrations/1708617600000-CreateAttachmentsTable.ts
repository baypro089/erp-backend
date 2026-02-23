import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAttachmentsTable1708617600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create attachments table
    await queryRunner.createTable(
      new Table({
        name: 'attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'path',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'size',
            type: 'bigint',
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'image',
              'document',
              'spreadsheet',
              'archive',
              'video',
              'audio',
              'text',
              'other',
            ],
            default: "'other'",
          },
          {
            name: 'folder',
            type: 'enum',
            enum: [
              'products',
              'employees',
              'customers',
              'orders',
              'documents',
              'reports',
              'imports',
              'returns',
              'temp',
              'avatars',
            ],
            default: "'temp'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived', 'deleted'],
            default: "'active'",
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'public_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'thumbnail_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_ATTACHMENTS_ENTITY',
        columnNames: ['entity_type', 'entity_id'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_ATTACHMENTS_FOLDER_TYPE',
        columnNames: ['folder', 'type'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_ATTACHMENTS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_ATTACHMENTS_UPLOADED_BY',
        columnNames: ['uploaded_by'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_ATTACHMENTS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('attachments', 'IDX_ATTACHMENTS_CREATED_AT');
    await queryRunner.dropIndex('attachments', 'IDX_ATTACHMENTS_UPLOADED_BY');
    await queryRunner.dropIndex('attachments', 'IDX_ATTACHMENTS_STATUS');
    await queryRunner.dropIndex('attachments', 'IDX_ATTACHMENTS_FOLDER_TYPE');
    await queryRunner.dropIndex('attachments', 'IDX_ATTACHMENTS_ENTITY');

    // Drop table
    await queryRunner.dropTable('attachments');
  }
}
