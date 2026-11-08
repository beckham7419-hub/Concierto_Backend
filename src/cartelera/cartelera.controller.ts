import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { CarteleraService } from './cartelera.service.js';
import { FiltrosCarteleraDto } from './dto/filtros-cartelera.dto.js';

@Roles(ROL.ADMIN, ROL.CLIENTE)
@Controller('cartelera')
export class CarteleraController {
    constructor(private readonly carteleraService: CarteleraService) {}

    @Get()
    findAll(@Query() filtros: FiltrosCarteleraDto) {
        return this.carteleraService.findAll(filtros);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.carteleraService.findOne(id);
    }

    @Get(':id/zonas/:zonaId/asientos')
    findAsientos(@Param('id', ParseIntPipe) id: number, @Param('zonaId', ParseIntPipe) zonaId: number) {
        return this.carteleraService.findAsientos(id, zonaId);
    }
}
