import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MenusModule } from './modules/menus/menus.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { OrdersModule } from './modules/orders/orders.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        FRONTEND_URL: Joi.string().uri().optional(),
        CLOUDINARY_URL: Joi.string().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        RESEND_API_KEY: Joi.string().required(),
        SMTP_FROM: Joi.string().default('onboarding@resend.dev'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60000),
          limit: config.get('THROTTLE_LIMIT', 10),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    MenusModule,
    CloudinaryModule,
    OrdersModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
