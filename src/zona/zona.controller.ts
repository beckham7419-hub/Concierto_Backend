import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { CreateZonaDto } from './dto/create-zona.dto.js';
import { UpdateZonaDto } from './dto/update-zona.dto.js';
import { ZonaService } from './zona.service.js';

@Roles(ROL.ADMIN)
@Controller('zonas')
export class ZonaController {
  constructor(private readonly zonaService: ZonaService) {}

  @Post()
  create(@Body() dto: CreateZonaDto) {
    return this.zonaService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zonaService.findOne(id);
  }

  @Get(':id/asientos')
  findAsientos(@Param('id', ParseIntPipe) id: number) {
    return this.zonaService.findAsientos(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateZonaDto) {
    return this.zonaService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.zonaService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.zonaService.activar(id);
  }
}
