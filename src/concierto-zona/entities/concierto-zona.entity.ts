import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('concierto_zona')
@Unique(['conciertoId', 'zonaId'])
export class ConciertoZona {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conciertoId: number;

    @Column()
    zonaId: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio: string;
}
