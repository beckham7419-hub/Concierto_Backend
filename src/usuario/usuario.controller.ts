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
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
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
