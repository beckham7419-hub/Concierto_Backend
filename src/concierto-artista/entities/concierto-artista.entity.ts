import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('concierto_artista')
@Unique(['conciertoId', 'artistaId'])
export class ConciertoArtista {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conciertoId: number;

    @Column()
    artistaId: number;
}
