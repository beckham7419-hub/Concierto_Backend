import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { Usuario } from './entities/usuario.entity.js';
import { UsuarioService } from './usuario.service.js';

@Roles(ROL.ADMIN)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  crear(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.crear(dto);
  }

  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.buscar(id);
  }

  @Patch(':id')
  editar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.editar(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number, @Req() req: { usuario: Usuario }) {
    return this.usuarioService.desactivar(id, req.usuario);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.activar(id);
  }
}
