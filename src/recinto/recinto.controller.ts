import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { CreateRecintoDto } from './dto/create-recinto.dto.js';
import { UpdateRecintoDto } from './dto/update-recinto.dto.js';
import { RecintoService } from './recinto.service.js';

@Roles(ROL.ADMIN)
@Controller('recintos')
export class RecintoController {
  constructor(private readonly recintoService: RecintoService) {}

  @Post()
  create(@Body() dto: CreateRecintoDto) {
    return this.recintoService.create(dto);
  }

  @Get()
  findAll() {
    return this.recintoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recintoService.findOne(id);
  }

  @Get(':id/zonas')
  findZonas(@Param('id', ParseIntPipe) id: number) {
    return this.recintoService.findZonas(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecintoDto) {
    return this.recintoService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.recintoService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.recintoService.activar(id);
  }
}
