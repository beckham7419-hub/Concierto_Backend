import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { ROL } from '../constantes.js';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { RegistroDto } from './dto/registro.dto.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
        @InjectRepository(Rol) private roles: Repository<Rol>,
    ) {}

    async registro(dto: RegistroDto) {
        if (await this.usuarios.existsBy({ correo: dto.correo })) {
            throw new ConflictException('Ese correo ya esta registrado');
        }
        const rolCliente = await this.roles.findOneByOrFail({ nombre: ROL.CLIENTE });
        const usuario = this.usuarios.create({
            ...dto,
            contrasena: await hash(dto.contrasena, 10),
            rolId: rolCliente.id,
        });
        return this.usuarios.save(usuario);
    }
}
