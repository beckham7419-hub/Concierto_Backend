import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('metodos_pago')
export class MetodoPago {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    nombre: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
