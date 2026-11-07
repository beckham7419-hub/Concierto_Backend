import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { ArtistaService } from './artista.service.js';
import { CreateArtistaDto } from './dto/create-artista.dto.js';
import { UpdateArtistaDto } from './dto/update-artista.dto.js';

@Roles(ROL.ADMIN)
@Controller('artistas')
export class ArtistaController {
  constructor(private readonly artistaService: ArtistaService) {}

  @Post()
  create(@Body() dto: CreateArtistaDto) {
    return this.artistaService.create(dto);
  }

  @Roles(ROL.ADMIN, ROL.CLIENTE)
  @Get()
  findAll() {
    return this.artistaService.findAll();
  }

  @Roles(ROL.ADMIN, ROL.CLIENTE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artistaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArtistaDto) {
    return this.artistaService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.artistaService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.artistaService.activar(id);
  }
}
