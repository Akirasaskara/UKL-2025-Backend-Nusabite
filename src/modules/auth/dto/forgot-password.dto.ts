import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'contoh@email.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;
}
