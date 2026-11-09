import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Artista } from '../../artista/entities/artista.entity.js';
import { ESTADO_CONCIERTO } from '../../constantes.js';
import { Recinto } from '../../recinto/entities/recinto.entity.js';

@Entity('conciertos')
export class Concierto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ type: 'datetime' })
    fecha: Date;

    @Column()
    recintoId: number;

    recinto?: Recinto;

    artistas?: Artista[];

    zonas?: { zonaId: number; nombre: string; precio: string }[];

    @Column({ type: 'enum', enum: Object.values(ESTADO_CONCIERTO), default: ESTADO_CONCIERTO.PROGRAMADO })
    estado: string;

    @Column({ type: 'int', nullable: true })
    imagenId: number | null;
}
