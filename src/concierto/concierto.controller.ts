import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { ConciertoService } from './concierto.service.js';
import { AsignarArtistasDto } from './dto/asignar-artistas.dto.js';
import { AsignarPreciosDto } from './dto/asignar-precios.dto.js';
import { CreateConciertoDto } from './dto/create-concierto.dto.js';
import { UpdateConciertoDto } from './dto/update-concierto.dto.js';

@Roles(ROL.ADMIN)
@Controller('conciertos')
export class ConciertoController {
  constructor(private readonly conciertoService: ConciertoService) {}

  @Post()
  create(@Body() dto: CreateConciertoDto) {
    return this.conciertoService.create(dto);
  }

  @Get()
  findAll() {
    return this.conciertoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conciertoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConciertoDto) {
    return this.conciertoService.update(id, dto);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.conciertoService.cancelar(id);
  }

  @Put(':id/artistas')
  asignarArtistas(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarArtistasDto) {
    return this.conciertoService.asignarArtistas(id, dto);
  }

  @Put(':id/precios')
  asignarPrecios(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarPreciosDto) {
    return this.conciertoService.asignarPrecios(id, dto);
  }
}
