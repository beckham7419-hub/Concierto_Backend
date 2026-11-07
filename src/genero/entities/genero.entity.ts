import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('generos')
export class Genero {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    nombre: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
