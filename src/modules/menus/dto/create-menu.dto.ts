import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
  @ApiProperty({ example: 'Nasi Goreng Spesial', description: 'Nama menu' })
  @IsString()
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  name: string;

  @ApiPropertyOptional({
    example: 'Nasi goreng telur dan ayam',
    description: 'Deskripsi menu',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25000, description: 'Harga menu dalam Rupiah' })
  @IsNumber()
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/...',
    description: 'URL gambar menu',
  })
  @IsUrl({}, { message: 'Format URL gambar tidak valid' })
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Status ketersediaan menu',
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({
    example: 'clxxxxxxxxxxx',
    description: 'ID kategori yang dipilih',
  })
  @IsString()
  @IsNotEmpty({ message: 'categoryId tidak boleh kosong' })
  categoryId: string;
}
