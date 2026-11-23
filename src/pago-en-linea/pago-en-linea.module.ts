import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BD_TICKET } from '../constantes.js';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Pago } from '../pago/entities/pago.entity.js';
import { PagoModule } from '../pago/pago.module.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketModule } from '../ticket/ticket.module.js';
import { PagoEnLineaController } from './pago-en-linea.controller.js';
import { PagoEnLineaService } from './pago-en-linea.service.js';
import { StripeService } from './stripe.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([MetodoPago]), TypeOrmModule.forFeature([Pago, Ticket], BD_TICKET), TicketModule, PagoModule],
    controllers: [PagoEnLineaController],
    providers: [PagoEnLineaService, StripeService],
})
export class PagoEnLineaModule {}
