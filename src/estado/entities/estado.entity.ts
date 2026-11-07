import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('estados')
export class Estado {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    nombre: string;
}
