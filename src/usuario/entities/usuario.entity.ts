import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Rol } from '../../roles/rol.entity.js';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ length: 100 })
    nombre: string;
    
    @Column({ length: 100 })
    apellido: string;
    
    @Column({ length: 150, unique: true })
    correo: string;
    
    @Exclude()
    @Column({ length: 255 })
    contrasena: string;
    
    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono: string | null;
    
    @Column()
    rolId: number;

    rol?: Rol;
    
    @Exclude()
    @Column({ type: 'varchar', length: 64, nullable: true })
    sesionId: string | null;
    
    @Column({ type: 'boolean', default: true })
    activo: boolean;
    
    @CreateDateColumn()
    creadoEn: Date;
}
