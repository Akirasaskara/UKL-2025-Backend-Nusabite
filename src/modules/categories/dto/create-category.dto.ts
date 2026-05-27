import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Makanan Utama',
    description: 'Nama kategori makanan',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  name: string;
}
