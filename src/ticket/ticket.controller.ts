import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { TicketService } from './ticket.service.js';

@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    @Roles(ROL.CLIENTE)
    @Post()
    create(@Req() req: { usuario: Usuario }, @Body() dto: CreateTicketDto) {
        return this.ticketService.create(req.usuario, dto);
    }

    @Roles(ROL.CLIENTE)
    @Get('mis')
    misTickets(@Req() req: { usuario: Usuario }) {
        return this.ticketService.misTickets(req.usuario);
    }

    @Roles(ROL.ADMIN)
    @Get('clave/:clave')
    buscarPorClave(@Param('clave') clave: string) {
        return this.ticketService.buscarPorClave(clave);
    }

    @Roles(ROL.ADMIN, ROL.CLIENTE)
    @Patch(':id/cancelar')
    cancelar(@Req() req: { usuario: Usuario }, @Param('id', ParseIntPipe) id: number) {
        return this.ticketService.cancelar(req.usuario, id);
    }

    @Roles(ROL.ADMIN)
    @Patch(':id/usar')
    usar(@Req() req: { usuario: Usuario }, @Param('id', ParseIntPipe) id: number) {
        return this.ticketService.usar(req.usuario, id);
    }
}
