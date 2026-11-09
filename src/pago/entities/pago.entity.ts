import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { MetodoPago } from '../../metodo-pago/entities/metodo-pago.entity.js';
import { Ticket } from '../../ticket/entities/ticket.entity.js';

@Entity('pagos')
export class Pago {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    ticketId: number;

    ticket?: Ticket;

    @Column()
    metodoPagoId: number;

    metodoPago?: MetodoPago;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montoRecibido: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    cambio: string;

    @Column()
    cobradoPorId: number;

    @CreateDateColumn()
    creadoEn: Date;
}
