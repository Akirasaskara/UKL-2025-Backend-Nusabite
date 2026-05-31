import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Meja-05', description: 'Filter by Meja' })
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by Status' })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
