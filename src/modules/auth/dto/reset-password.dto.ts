import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-acak-dari-email' })
  @IsString()
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;

  @ApiProperty({ example: 'passwordBaru123' })
  @IsString()
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  newPassword: string;
}
