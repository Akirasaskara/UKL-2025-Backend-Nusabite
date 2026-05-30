import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: createMenuDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID ${createMenuDto.categoryId} tidak ditemukan`,
      );
    }

    return this.prisma.menu.create({
      data: createMenuDto,
      include: { category: true },
    });
  }

  async findAll() {
    return this.prisma.menu.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
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

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    await this.findOne(id);

    if (updateMenuDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateMenuDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Kategori dengan ID ${updateMenuDto.categoryId} tidak ditemukan`,
        );
      }
    }

    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.menu.delete({
      where: { id },
    });
  }
}
