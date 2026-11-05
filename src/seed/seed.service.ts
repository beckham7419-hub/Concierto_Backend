import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { isEmail } from 'class-validator';
import { Repository } from 'typeorm';
import { PASSWORD_MAX, PASSWORD_MIN, ROL } from '../constantes.js';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);
    constructor(
        @InjectRepository(Rol) private readonly roles: Repository<Rol>,
        @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    ) {}

    async onModuleInit() {
        await this.crearRoles();
        await this.crearPrimerAdmin();
    }

    private async crearRoles() {
        for (const nombre of Object.values(ROL)) {
            if (!(await this.roles.existsBy({ nombre }))) {
                await this.roles.save(this.roles.create({ nombre }));
                this.logger.log(`Rol creado: ${nombre}`);
            }
        }
    }

    private async crearPrimerAdmin() {
        const rolAdmin = await this.roles.findOneByOrFail({ nombre: ROL.ADMIN });
        if (await this.usuarios.existsBy({ rolId: rolAdmin.id })) return;

        const correo = process.env.ADMIN_CORREO?.trim().toLowerCase();
        const contrasena = process.env.ADMIN_PASSWORD;
        if (!correo || !contrasena) {
            throw new Error('Falta ADMIN_CORREO o ADMIN_PASSWORD en el .env: se necesitan para crear el primer administrador');
        }
        if (!isEmail(correo)) {
            throw new Error('ADMIN_CORREO no es un correo valido');
        }
        if (contrasena.length < PASSWORD_MIN || contrasena.length > PASSWORD_MAX) {
            throw new Error(`ADMIN_PASSWORD debe tener de ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres`);
        }
        if (await this.usuarios.existsBy({ correo })) {
            throw new Error(`El correo ${correo} ya lo usa un usuario que no es administrador: cambia ADMIN_CORREO en el .env`);
        }

        await this.usuarios.save(
            this.usuarios.create({
                nombre: 'Administrador',
                apellido: 'Inicial',
                correo,
                contrasena: await hash(contrasena, 10),
                rolId: rolAdmin.id,
            }),
        );
        this.logger.log(`Primer administrador creado: ${correo}`);
    }
}
