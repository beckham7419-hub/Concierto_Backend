import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Concierto } from '../../concierto/entities/concierto.entity.js';
import { ESTADO_TICKET, LARGO_CLAVE } from '../../constantes.js';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: LARGO_CLAVE, unique: true })
    clave: string;

    @Column()
    usuarioId: number;

    @Column()
    conciertoId: number;

    concierto?: Concierto;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: string;

    @Column({ type: 'enum', enum: Object.values(ESTADO_TICKET), default: ESTADO_TICKET.PENDIENTE })
    estado: string;

    @Column({ type: 'datetime' })
    fechaLimite: Date;

    @CreateDateColumn()
    creadoEn: Date;

    asientos?: { asientoId: number; zonaId: number; zona: string; fila: string; numero: number; precio: string }[];
}
