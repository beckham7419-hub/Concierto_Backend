import { Body, Controller, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { PagoService } from './pago.service.js';

@Roles(ROL.ADMIN)
@Controller('pagos')
export class PagoController {
    constructor(private readonly pagoService: PagoService) {}

    @Post()
    create(@Req() req: { usuario: Usuario }, @Body() dto: CreatePagoDto) {
        return this.pagoService.create(req.usuario, dto);
    }
}
