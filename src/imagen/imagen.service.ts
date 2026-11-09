import { ConflictException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { buscarActivo } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { IMAGEN_NOMBRE_MAX } from '../constantes.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Imagen } from './entities/imagen.entity.js';

export type ArchivoSubido = { originalname: string; mimetype: string; buffer: Buffer };

@Injectable()
export class ImagenService {
    constructor(
        @InjectRepository(Imagen) private readonly imagenes: Repository<Imagen>,
        @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
        @InjectRepository(Concierto) private readonly conciertos: Repository<Concierto>,
        private readonly dataSource: DataSource,
    ) {}

    private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
        return this.dataSource.transaction('READ COMMITTED', trabajo);
    }

    private armarNombre(archivo: ArchivoSubido) {
        return Array.from(archivo.originalname.trim()).slice(0, IMAGEN_NOMBRE_MAX).join('') || 'imagen';
    }

    async create(archivo: ArchivoSubido) {
        try {
            const imagen = await this.imagenes.save(
                this.imagenes.create({
                    nombre: this.armarNombre(archivo),
                    tipo: archivo.mimetype,
                    archivo: archivo.buffer,
                }),
            );
            return await buscarActivo(this.imagenes, imagen.id, 'Imagen', false);
        }
        catch (error) {
            manejarError(error, 'Error al subir la imagen');
        }
    }

    async findOne(id: number) {
        try {
            const imagen = await this.imagenes.findOne({
                select: { id: true, tipo: true, archivo: true },
                where: { id },
            });
            if (!imagen) throw new NotFoundException('Imagen no encontrado');
            return new StreamableFile(imagen.archivo, { type: imagen.tipo });
        }
        catch (error) {
            manejarError(error, 'Error al obtener la imagen');
        }
    }

    async update(id: number, archivo: ArchivoSubido) {
        try {
            await buscarActivo(this.imagenes, id, 'Imagen', false);
            await this.imagenes.update(
                { id },
                { nombre: this.armarNombre(archivo), tipo: archivo.mimetype, archivo: archivo.buffer },
            );
            return await buscarActivo(this.imagenes, id, 'Imagen', false);
        }
        catch (error) {
            manejarError(error, 'Error al reemplazar la imagen');
        }
    }

    async remove(id: number) {
        try {
            await this.transaccion(async (manager) => {
                const imagen = await manager.findOne(Imagen, { where: { id }, lock: { mode: 'pessimistic_write' } });
                if (!imagen) throw new NotFoundException('Imagen no encontrado');
                const enUso = (await manager.existsBy(Recinto, { imagenId: id }))
                    || (await manager.existsBy(Concierto, { imagenId: id }));
                if (enUso) throw new ConflictException('La imagen esta en uso, no se puede quitar');
                await manager.delete(Imagen, { id });
            });
            return { ok: true };
        }
        catch (error) {
            manejarError(error, 'Error al quitar la imagen');
        }
    }
}
