import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IMAGEN_NOMBRE_MAX } from '../../constantes.js';

@Entity('imagenes')
export class Imagen {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: IMAGEN_NOMBRE_MAX })
    nombre: string;

    @Column({ length: 50 })
    tipo: string;

    @Column({ type: 'longblob', select: false })
    archivo: Buffer;

    @CreateDateColumn()
    creadoEn: Date;
}
