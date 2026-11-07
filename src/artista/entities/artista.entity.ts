import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Genero } from '../../genero/entities/genero.entity.js';

@Entity('artistas')
export class Artista {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    nombre: string;

    @Column()
    generoId: number;

    genero?: Genero;

    @Column({ type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
