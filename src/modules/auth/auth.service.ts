import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { HashUtil } from '../../common/utils/hash.util';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET')!,
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ??
          '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await HashUtil.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  async register(dto: RegisterDto) {
    // 1. Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // 2. Hash password menggunakan utility
    const hashedPassword = await HashUtil.hash(dto.password);

    // 3. Simpan user ke database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    // 4. Jangan kembalikan password ke client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user;

    return { message: 'Registrasi berhasil', data: result };
  }

  async login(dto: LoginDto) {
    // 1. Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Pesan error dibuat generik → attacker tidak tahu apakah email ada atau tidak
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 2. Bandingkan password dengan hash di database
    const isPasswordValid = await HashUtil.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 3. Generate access token & refresh token
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Update hash RT ke database
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      message: 'Login berhasil',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: { hashedRefreshToken: null },
    });
    return { message: 'Logout berhasil' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Akses ditolak');
    }

    const rtMatches = await HashUtil.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!rtMatches) {
      throw new UnauthorizedException('Akses ditolak');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      message: 'Token berhasil diperbarui',
      data: tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { message: 'Profil berhasil diambil', data: user };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message: 'Jika email terdaftar, instruksi reset akan dikirimkan',
      };
    }

    // Generate token reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // T1 hour token
    const resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires,
      },
    });

    // Buat URL reset
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Kirim email
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
      to: user.email,
      subject: 'Amara - Reset Password',
      html: `
        <h2>Halo ${user.name},</h2>
        <p>Anda telah meminta untuk mereset password akun Amara Anda.</p>
        <p>Silakan klik tautan di bawah ini untuk mengatur ulang sandi Anda (berlaku selama 1 jam):</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>Jika Anda tidak pernah meminta reset password, abaikan email ini.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending reset email:', error);
      // Fallback jika SMTP gagal/belum disetting: hapus token dari DB
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpires: null },
      });
      throw new BadRequestException(
        'Gagal mengirim email reset. Pastikan SMTP terkonfigurasi dengan benar.',
      );
    }

    return { message: 'Jika email terdaftar, instruksi reset akan dikirimkan' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: {
          gt: new Date(), // Pastikan token belum expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah kedaluwarsa',
      );
    }

    // Hash password baru
    const hashedPassword = await HashUtil.hash(dto.newPassword);

    // Update password dan kosongkan field reset
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      message:
        'Password berhasil diubah. Silakan login dengan password baru Anda.',
    };
  }
}
