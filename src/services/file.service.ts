import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileService {
  private readonly uploadRoot = path.resolve(process.cwd(), 'uploads');

  constructor() {
    this.ensureDir(this.uploadRoot);
  }

  /* =========================
     Upload file (local)
  ========================== */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'temp',
  ): Promise<string> {
    try {
      const uploadDir = path.join(this.uploadRoot, folder);
      this.ensureDir(uploadDir);

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuid()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, file.buffer);

      return `${folder}/${fileName}`; // path lưu DB
    } catch (error) {
      throw new InternalServerErrorException('Upload file failed');
    }
  }

  /* =========================
     Read file
  ========================== */
  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    return fs.promises.readFile(fullPath);
  }

  /* =========================
     Delete file
  ========================== */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadRoot, filePath);

    if (!fs.existsSync(fullPath)) return;

    await fs.promises.unlink(fullPath);
  }

  /* =========================
     Helpers
  ========================== */
  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
