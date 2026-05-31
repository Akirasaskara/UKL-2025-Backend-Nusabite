import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ADMIN ONLY
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Menambahkan menu baru + upload gambar (Khusus Admin)',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  create(
    @Body() createMenuDto: CreateMenuDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.create(createMenuDto, file);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update menu + ganti gambar (Khusus Admin)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.update(id, updateMenuDto, file);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hapus menu (Khusus Admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  // PUBLIC
  @ApiOperation({
    summary: 'Melihat semua menu dengan pagination & filter (Public)',
  })
  @Get()
  findAll(@Query() query: MenuQueryDto) {
    return this.menusService.findAll(query);
  }

  @ApiOperation({ summary: 'Melihat detail satu menu (Public)' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }
}
