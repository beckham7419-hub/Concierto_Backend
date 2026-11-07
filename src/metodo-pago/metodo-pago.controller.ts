import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto.js';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto.js';
import { MetodoPagoService } from './metodo-pago.service.js';

@Roles(ROL.ADMIN)
@Controller('metodos-pago')
export class MetodoPagoController {
  constructor(private readonly metodoPagoService: MetodoPagoService) {}

  @Post()
  create(@Body() dto: CreateMetodoPagoDto) {
    return this.metodoPagoService.create(dto);
  }

  @Get()
  findAll() {
    return this.metodoPagoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metodoPagoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMetodoPagoDto) {
    return this.metodoPagoService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.metodoPagoService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.metodoPagoService.activar(id);
  }
}
