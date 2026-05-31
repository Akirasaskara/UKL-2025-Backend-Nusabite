import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PAID,
    description: 'Status order baru',
  })
  @IsEnum(OrderStatus, { message: 'Status tidak valid' })
  @IsNotEmpty()
  status: OrderStatus;
}
