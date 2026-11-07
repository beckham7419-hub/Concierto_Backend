import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Recinto } from '../../recinto/entities/recinto.entity.js';

@Entity('zonas')
@Unique(['recintoId', 'nombre'])
export class Zona {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    recintoId: number;

    recinto?: Recinto;

    @Column({ length: 50 })
    nombre: string;

    @Column()
    filas: number;

    @Column()
    asientosPorFila: number;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
