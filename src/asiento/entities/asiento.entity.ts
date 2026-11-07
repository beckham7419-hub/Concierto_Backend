import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('asientos')
@Unique(['zonaId', 'fila', 'numero'])
export class Asiento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    zonaId: number;

    @Column({ length: 5 })
    fila: string;

    @Column()
    numero: number;
}
