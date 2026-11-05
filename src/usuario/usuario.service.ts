import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Not, Repository } from 'typeorm';
import { adjuntar, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Rol } from '../roles/rol.entity.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { Usuario } from './entities/usuario.entity.js';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
  ) {}

  private async validarCorreo(correo: string, idPropio?: number) {
    const donde = idPropio ? { correo, id: Not(idPropio) } : { correo };
    if (await this.usuarios.existsBy(donde)) {
      throw new ConflictException('Ese correo ya esta registrado');
    }
  }

  private async conRol(usuario: Usuario) {
    usuario.rol = (await this.roles.findOneBy({ id: usuario.rolId })) ?? undefined;
    return usuario;
  }

  async crear(dto: CreateUsuarioDto) {
    try {
      await buscarActivo(this.roles, dto.rolId, 'Rol', false);
      await this.validarCorreo(dto.correo);
      const usuario = await this.usuarios.save(
        this.usuarios.create({ ...dto, contrasena: await hash(dto.contrasena, 10) }),
      );
      return await this.conRol(usuario);
    }
    catch (error) {
      manejarError(error, 'Error al crear el usuario');
    }
  }

  async listar() {
    try {
      const lista = await this.usuarios.find({ order: { id: 'ASC' } });
      return await adjuntar(lista, 'rolId', this.roles, 'rol');
    }
    catch (error) {
      manejarError(error, 'Error al obtener los usuarios');
    }
  }

  async buscar(id: number) {
    try {
      const usuario = await buscarActivo(this.usuarios, id, 'Usuario', false);
      return await this.conRol(usuario);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el usuario');
    }
  }

  async editar(id: number, dto: UpdateUsuarioDto) {
    try {
      await buscarActivo(this.usuarios, id, 'Usuario', false);
      if (dto.correo) await this.validarCorreo(dto.correo, id);
      const cambios = soloLoQueVino(dto);
      if (dto.contrasena) cambios.contrasena = await hash(dto.contrasena, 10);
      if (Object.keys(cambios).length > 0) await this.usuarios.update({ id }, cambios);
      return await this.buscar(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el usuario');
    }
  }

  async desactivar(id: number, admin: Usuario) {
    try {
      if (id === admin.id) throw new ConflictException('No puedes desactivarte a ti mismo');
      const resultado = await this.usuarios.update({ id }, { activo: false, sesionId: null });
      if (!resultado.affected) throw new NotFoundException('Usuario no encontrado');
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar el usuario');
    }
  }

  async activar(id: number) {
    try {
      const resultado = await this.usuarios.update({ id }, { activo: true });
      if (!resultado.affected) throw new NotFoundException('Usuario no encontrado');
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar el usuario');
    }
  }
}
