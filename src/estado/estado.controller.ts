import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { EstadoService } from './estado.service.js';

@Roles(ROL.ADMIN, ROL.CLIENTE)
@Controller('estados')
export class EstadoController {
  constructor(private readonly estadoService: EstadoService) {}

  @Get()
  findAll() {
    return this.estadoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.findOne(id);
  }
}
