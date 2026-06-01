import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

import { PaginationResult } from '../../common/interfaces/paginated-result.interface';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuQueryDto, SortOrder } from './dto/menu-query.dto';

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createMenuDto: CreateMenuDto, file?: Express.Multer.File) {
    const category = await this.prisma.category.findUnique({
      where: { id: createMenuDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID ${createMenuDto.categoryId} tidak ditemukan`,
      );
    }

    let imageUrl: string | undefined;
    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'amara/menus',
      );
      imageUrl = uploaded.secureUrl;
      this.logger.log(`Gambar diupload: ${uploaded.publicId}`);
    }

    return this.prisma.menu.create({
      data: { ...createMenuDto, imageUrl },
      include: { category: true },
    });
  }

  async findAll(query: MenuQueryDto): Promise<PaginationResult<any>> {
    const {
      page,
      limit,
      skip,
      search,
      categoryId,
      isAvailable,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.menu.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder === SortOrder.ASC ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.menu.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }
    return menu;
  }

  async update(
    id: string,
    updateMenuDto: UpdateMenuDto,
    file?: Express.Multer.File,
  ) {
    const menu = await this.findOne(id);

    let imageUrl = menu.imageUrl;
    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'amara/menus',
      );
      imageUrl = uploaded.secureUrl;
      this.logger.log(`Gambar diupload ulang: ${uploaded.publicId}`);
    }

    return this.prisma.menu.update({
      where: { id },
      data: { ...updateMenuDto, imageUrl },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.menu.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Menu ini tidak bisa dihapus karena sudah tercatat di riwayat pesanan pelanggan. Sebagai gantinya, silakan edit dan matikan tombol "Tersedia".',
        );
      }
      throw error;
    }
  }
}
