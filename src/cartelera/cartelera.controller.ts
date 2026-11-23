import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { CarteleraService } from './cartelera.service.js';
import { ApartarAsientoDto } from './dto/apartar-asiento.dto.js';
import { CambiosAsientosDto } from './dto/cambios-asientos.dto.js';
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

    @Get(':id/zonas/:zonaId/cambios')
    cambios(
        @Req() req: { usuario: Usuario },
        @Res({ passthrough: true }) res: Response,
        @Param('id', ParseIntPipe) id: number,
        @Param('zonaId', ParseIntPipe) zonaId: number,
        @Query() consulta: CambiosAsientosDto,
    ) {
        const cancelar = new AbortController();
        res.once('close', () => cancelar.abort());
        return this.carteleraService.cambios(req.usuario, id, zonaId, consulta.version, cancelar.signal);
    }

    @Roles(ROL.CLIENTE)
    @Post(':id/apartados')
    apartar(@Req() req: { usuario: Usuario }, @Param('id', ParseIntPipe) id: number, @Body() dto: ApartarAsientoDto) {
        return this.carteleraService.apartar(req.usuario, id, dto);
    }

    @Roles(ROL.CLIENTE)
    @Delete(':id/apartados/:asientoId')
    soltar(@Req() req: { usuario: Usuario }, @Param('id', ParseIntPipe) id: number, @Param('asientoId', ParseIntPipe) asientoId: number) {
        return this.carteleraService.soltar(req.usuario, id, asientoId);
    }

    @Roles(ROL.CLIENTE)
    @Delete(':id/apartados')
    soltarTodos(@Req() req: { usuario: Usuario }, @Param('id', ParseIntPipe) id: number) {
        return this.carteleraService.soltarTodos(req.usuario, id);
    }
}
