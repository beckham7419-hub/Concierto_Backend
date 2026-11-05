import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ES_PUBLICA, ROLES_KEY } from './decoradores.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext) {
        const lugares = [context.getHandler(), context.getClass()];
        const esPublica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, lugares);
        if (esPublica) return true;

        const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, lugares);
        if (!roles || roles.length === 0) throw new ForbiddenException('Ruta sin roles definidos');

        const usuario = context.switchToHttp().getRequest().usuario;
        if (!usuario || !usuario.rol || !roles.includes(usuario.rol.nombre)) {
            throw new ForbiddenException('Tu rol no puede hacer esto');
        }
        return true;
    }
}
