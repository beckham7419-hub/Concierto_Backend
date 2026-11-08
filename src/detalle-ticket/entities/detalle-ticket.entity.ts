import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { OCUPADO } from '../../constantes.js';

@Entity('detalle_ticket')
@Unique(['ticketId', 'asientoId'])
@Unique(['conciertoId', 'asientoId', 'ocupado'])
export class DetalleTicket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ticketId: number;

    @Column()
    conciertoId: number;

    @Column()
    asientoId: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio: string;

    @Column({ type: 'tinyint', nullable: true, default: OCUPADO })
    ocupado: number | null;
}
