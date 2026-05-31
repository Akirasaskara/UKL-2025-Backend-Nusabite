import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common';

export enum MenuSortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class MenuQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'nasi', description: 'Cari nama menu' })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxx',
    description: 'Filter by categoryId',
  })
  @IsOptional()
  @IsString()
  readonly categoryId?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by ketersediaan' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  readonly isAvailable?: boolean;

  @ApiPropertyOptional({ enum: MenuSortBy, default: MenuSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(MenuSortBy)
  readonly sortBy: MenuSortBy = MenuSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  readonly sortOrder: SortOrder = SortOrder.DESC;
}
