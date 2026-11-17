import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto.js';
import { CrearCheckoutDto } from './dto/crear-checkout.dto.js';
import { PagoEnLineaService } from './pago-en-linea.service.js';

@Controller('pagos/en-linea')
export class PagoEnLineaController {
    constructor(private readonly pagoEnLineaService: PagoEnLineaService) {}

    @Roles(ROL.CLIENTE)
    @Get('estado')
    estado() {
        return this.pagoEnLineaService.estado();
    }

    @Roles(ROL.ADMIN)
    @Get('probar')
    probar() {
        return this.pagoEnLineaService.probar();
    }

    @Roles(ROL.CLIENTE)
    @Post('checkout')
    crearCheckout(@Req() req: { usuario: Usuario }, @Body() dto: CrearCheckoutDto) {
        return this.pagoEnLineaService.crearCheckout(req.usuario, dto);
    }

    @Roles(ROL.CLIENTE)
    @Post('confirmar')
    confirmar(@Req() req: { usuario: Usuario }, @Body() dto: ConfirmarPagoDto) {
        return this.pagoEnLineaService.confirmar(req.usuario, dto);
    }
}
