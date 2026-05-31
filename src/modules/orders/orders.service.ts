import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { tableNumber, customerName, notes, items } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order minimal harus ada 1 item');
    }

    // Ambil data menu dari database berdasarkan menuId yang dikirim
    const menuIds = items.map((item) => item.menuId);
    const menus = await this.prisma.menu.findMany({
      where: { id: { in: menuIds } },
    });

    if (menus.length !== menuIds.length) {
      throw new NotFoundException('Satu atau lebih menu tidak ditemukan');
    }

    // Cek ketersediaan dan hitung subtotal
    let totalPrice = 0;
    const orderItemsData = items.map((item) => {
      const menu = menus.find((m) => m.id === item.menuId);

      if (!menu) {
        throw new NotFoundException(
          `Menu dengan ID ${item.menuId} tidak ditemukan`,
        );
      }

      if (!menu.isAvailable) {
        throw new BadRequestException(
          `Menu ${menu.name} sedang tidak tersedia`,
        );
      }

      const subtotal = Number(menu.price) * item.quantity;
      totalPrice += subtotal;

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        price: menu.price,
        subtotal: subtotal,
      };
    });

    // Buat order dan orderItems dalam 1 transaksi
    return this.prisma.order.create({
      data: {
        tableNumber,
        customerName,
        notes,
        totalPrice,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: { menu: { select: { name: true, imageUrl: true } } },
        },
      },
    });
  }

  async trackOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { menu: { select: { name: true, imageUrl: true } } },
        },
      },
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  async findAll(query: OrderQueryDto) {
    const { page, limit, skip, tableNumber, status } = query;

    const where: any = {};
    if (tableNumber)
      where.tableNumber = { contains: tableNumber, mode: 'insensitive' };
    if (status) where.status = status;

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          orderItems: {
            include: { menu: { select: { name: true } } },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOneForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { menu: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto) {
    await this.findOneForAdmin(id); // validasi exists

    return this.prisma.order.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }
}
