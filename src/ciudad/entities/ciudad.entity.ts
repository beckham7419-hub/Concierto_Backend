import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Estado } from '../../estado/entities/estado.entity.js';

@Entity('ciudades')
@Unique(['nombre', 'estadoId'])
export class Ciudad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column()
    estadoId: number;

    estado?: Estado;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
