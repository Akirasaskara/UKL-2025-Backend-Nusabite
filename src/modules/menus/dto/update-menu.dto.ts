import { CreateMenuDto } from './create-menu.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
