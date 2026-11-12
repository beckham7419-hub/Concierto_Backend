import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { ES_PUBLICA } from './decoradores.js';

@Injectable()
export class SesionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwt: JwtService,
        @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
        @InjectRepository(Rol) private roles: Repository<Rol>,
    ) {}

    async canActivate(context: ExecutionContext) {
        const esPublica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [context.getHandler(), context.getClass()]);
        if (esPublica) return true;

        const req = context.switchToHttp().getRequest();
        const cabecera: string = req.headers['authorization'] || '';
        const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
        if (!token) throw new UnauthorizedException('Falta el token');

        let datos: any;
        try {
            datos = await this.jwt.verifyAsync(token);
        }
        catch {
            throw new UnauthorizedException('Token invalido');
        }
        if (!datos.sub || !datos.sid) throw new UnauthorizedException('Token invalido');

        const usuario = await this.usuarios.findOneBy({ id: datos.sub });
        if (!usuario || !usuario.activo || !usuario.sesionId || usuario.sesionId !== datos.sid) {
            throw new UnauthorizedException('Sesion no valida');
        }
        usuario.rol = (await this.roles.findOneBy({ id: usuario.rolId })) ?? undefined;
        req.usuario = usuario;
        return true;
    }
}
