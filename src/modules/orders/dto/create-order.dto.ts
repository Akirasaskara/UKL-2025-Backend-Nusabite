import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'clxxxxxxxxxxx', description: 'ID Menu' })
  @IsString()
  @IsNotEmpty()
  menuId: string;
  @ApiProperty({ example: 2, description: 'Jumlah pesanan' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Meja-05', description: 'Nomor meja pelanggan' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor meja wajib diisi' })
  tableNumber: string;
  @ApiPropertyOptional({ example: 'Budi', description: 'Nama pelanggan' })
  @IsString()
  @IsOptional()
  customerName?: string;
  @ApiPropertyOptional({ example: 'Tolong jangan pakai sambal' })
  @IsString()
  @IsOptional()
  notes?: string;
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar menu yang dipesan',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
