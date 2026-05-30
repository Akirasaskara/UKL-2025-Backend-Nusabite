import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ------------------------------------------------------------------
  // ADMIN ONLY
  // ------------------------------------------------------------------

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Menambahkan menu baru (Khusus Admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mengubah data menu (Khusus Admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Menghapus menu (Khusus Admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  // PUBLIC

  @ApiOperation({ summary: 'Melihat semua menu (Public)' })
  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  @ApiOperation({ summary: 'Melihat detail satu menu (Public)' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }
}
