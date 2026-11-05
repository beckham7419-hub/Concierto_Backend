import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RolesGuard } from './roles.guard.js';
import { SesionGuard } from './sesion.guard.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Usuario, Rol]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: Number(config.get('JWT_TTL')) },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        { provide: APP_GUARD, useClass: SesionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AuthModule {}
