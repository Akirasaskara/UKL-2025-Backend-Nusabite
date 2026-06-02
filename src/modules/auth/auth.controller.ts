import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@prisma/client';

// Interface untuk typing req.user yang di-set oleh JwtStrategy
interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

interface RefreshRequest {
  user: {
    userId: string;
    email: string;
    role: string;
    refreshToken: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Public — siapa saja bisa akses
   */
  @ApiOperation({ summary: 'Registrasi user baru' })
  @ApiResponse({ status: 201, description: 'User berhasil diregistrasi' })
  @ApiResponse({
    status: 400,
    description: 'Validasi gagal / Email sudah terdaftar',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * Public — siapa saja bisa akses
   */
  @ApiOperation({ summary: 'Login user untuk mendapatkan JWT Token' })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil, mengembalikan JWT Token',
  })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/auth/me
   * Protected — butuh JWT token valid
   *
   * JwtAuthGuard akan otomatis:
   * 1. Ambil token dari header Authorization
   * 2. Verifikasi token dengan JWT_SECRET
   * 3. Isi req.user dengan hasil JwtStrategy.validate()
   */
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mendapatkan profil user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil berhasil didapatkan' })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak dikirimkan',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: AuthRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  /**
   * GET /api/auth/admin-only
   * Protected — Hanya bisa diakses oleh role ADMIN
   */
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Endpoint khusus Admin' })
  @ApiResponse({ status: 200, description: 'Berhasil diakses oleh Admin' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Forbidden)' })
  @UseGuards(JwtAuthGuard, RolesGuard) // Urutan penting: verifikasi JWT dulu, baru cek Role
  @Roles(Role.ADMIN)
  @Get('admin-only')
  getAdminData(@Request() req: AuthRequest) {
    return {
      message: 'Selamat datang di area Admin!',
      user: req.user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user (Menghapus Refresh Token)' })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: AuthRequest) {
    return this.authService.logout(req.user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mendapatkan access token baru menggunakan refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token berhasil diperbarui' })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refreshTokens(@Request() req: RefreshRequest) {
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @ApiOperation({ summary: 'Meminta email reset password' })
  @ApiResponse({ status: 200, description: 'Instruksi dikirim jika email ada' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Mereset password dengan token' })
  @ApiResponse({ status: 200, description: 'Password berhasil diubah' })
  @ApiResponse({ status: 400, description: 'Token tidak valid / expired' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
