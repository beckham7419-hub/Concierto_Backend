import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Ciudad } from '../../ciudad/entities/ciudad.entity.js';

@Entity('recintos')
@Unique(['nombre', 'ciudadId'])
export class Recinto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column({ length: 255 })
    direccion: string;

    @Column()
    ciudadId: number;

    ciudad?: Ciudad;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ type: 'int', nullable: true })
    imagenId: number | null;
}
