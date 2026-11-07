import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { CiudadService } from './ciudad.service.js';
import { CreateCiudadDto } from './dto/create-ciudad.dto.js';
import { UpdateCiudadDto } from './dto/update-ciudad.dto.js';

@Roles(ROL.ADMIN)
@Controller('ciudades')
export class CiudadController {
  constructor(private readonly ciudadService: CiudadService) {}

  @Post()
  create(@Body() dto: CreateCiudadDto) {
    return this.ciudadService.create(dto);
  }

  @Roles(ROL.ADMIN, ROL.CLIENTE)
  @Get()
  findAll() {
    return this.ciudadService.findAll();
  }

  @Roles(ROL.ADMIN, ROL.CLIENTE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ciudadService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCiudadDto) {
    return this.ciudadService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.ciudadService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.ciudadService.activar(id);
  }
}
