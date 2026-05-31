import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryResponse {
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            return reject(
              new BadRequestException('Gagal upload gambar ke Cloudinary'),
            );
          }
          resolve({ publicId: result.public_id, secureUrl: result.secure_url });
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
