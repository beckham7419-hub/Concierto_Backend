import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ROL } from '../constantes.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { AuthService } from './auth.service.js';
import { Public, Roles } from './decoradores.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('registro')
    registro(@Body() dto: RegistroDto) {
        return this.authService.registro(dto);
    }

    @Public()
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Roles(ROL.ADMIN, ROL.CLIENTE)
    @Post('logout')
    logout(@Req() req: { usuario: Usuario }) {
        return this.authService.logout(req.usuario);
    }

    @Roles(ROL.ADMIN, ROL.CLIENTE)
    @Get('perfil')
    perfil(@Req() req: { usuario: Usuario }) {
        return req.usuario;
    }
}
