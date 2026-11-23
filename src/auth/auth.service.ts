import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { manejarError } from '../common/manejar-error.js';
import { ROL } from '../constantes.js';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
        @InjectRepository(Rol) private roles: Repository<Rol>,
        private jwt: JwtService,
    ) {}

    private async validarCorreo(correo: string) {
        if (await this.usuarios.existsBy({ correo })) {
            throw new ConflictException('Ese correo ya esta registrado');
        }
    }

    async registro(dto: RegistroDto) {
        try {
            await this.validarCorreo(dto.correo);
            const rolCliente = await this.roles.findOneByOrFail({ nombre: ROL.CLIENTE });
            const usuario = this.usuarios.create({
                ...dto,
                contrasena: await hash(dto.contrasena, 10),
                rolId: rolCliente.id,
            });
            return await this.usuarios.save(usuario);
        }
        catch (error) {
            manejarError(error, 'Error al registrar el usuario');
        }
    }

    async login(dto: LoginDto) {
        try {
            const usuario = await this.usuarios.findOneBy({ correo: dto.correo });
            if (!usuario || !usuario.activo || !(await compare(dto.contrasena, usuario.contrasena))) {
                throw new UnauthorizedException('Correo o contraseña incorrectos');
            }
            usuario.sesionId = randomBytes(16).toString('hex');
            await this.usuarios.update(usuario.id, { sesionId: usuario.sesionId });
            usuario.rol = await this.roles.findOneByOrFail({ id: usuario.rolId });
            const token = await this.jwt.signAsync({ sub: usuario.id, sid: usuario.sesionId });
            return { token, usuario };
        }
        catch (error) {
            manejarError(error, 'Error al iniciar sesion');
        }
    }

    async actualizarPerfil(usuario: Usuario, dto: ActualizarPerfilDto) {
        try {
            const cambios: Partial<Usuario> = {};
            if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
            if (dto.apellido !== undefined) cambios.apellido = dto.apellido;
            if (dto.telefono !== undefined) cambios.telefono = dto.telefono;
            if (dto.contrasenaNueva !== undefined) {
                if (!(await compare(dto.contrasenaActual ?? '', usuario.contrasena))) {
                    throw new BadRequestException('La contraseña actual no es correcta');
                }
                if (dto.contrasenaNueva === dto.contrasenaActual) {
                    throw new BadRequestException('La contraseña nueva debe ser diferente a la actual');
                }
                cambios.contrasena = await hash(dto.contrasenaNueva, 10);
            }
            if (Object.keys(cambios).length > 0) await this.usuarios.update(usuario.id, cambios);
            const actualizado = await this.usuarios.findOneByOrFail({ id: usuario.id });
            actualizado.rol = await this.roles.findOneByOrFail({ id: actualizado.rolId });
            return actualizado;
        }
        catch (error) {
            manejarError(error, 'Error al actualizar tu perfil');
        }
    }

    async logout(usuario: Usuario) {
        try {
            await this.usuarios.update(usuario.id, { sesionId: null });
            return { ok: true };
        }
        catch (error) {
            manejarError(error, 'Error al cerrar sesion');
        }
    }
}
