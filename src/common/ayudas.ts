import { NotFoundException } from '@nestjs/common';
import { EntityManager, EntityTarget, FindOptionsWhere, In, Repository } from 'typeorm';
import { Imagen } from '../imagen/entities/imagen.entity.js';

export async function buscarActivo<T extends { id: number; activo?: boolean }>(
    repo: Repository<T>,
    id: number,
    etiqueta: string,
    soloActivo = true,
): Promise<T> {
    if (!Number.isInteger(id) || id < 1) throw new NotFoundException(`${etiqueta} no encontrado`);
    const registro = await repo.findOneBy({ id } as FindOptionsWhere<T>);
    if (!registro || (soloActivo && registro.activo === false)) {
        throw new NotFoundException(`${etiqueta} no encontrado`);
    }
    return registro;
}

export async function adjuntar<T extends object, P extends { id: number }>(
    lista: T[],
    campoId: string,
    repo: Repository<P>,
    destino: string,
) {
    const filas = lista as Record<string, unknown>[];
    const ids = [...new Set(filas.map((x) => x[campoId]).filter((v) => v != null))] as number[];
    const padres = ids.length ? await repo.findBy({ id: In(ids) } as FindOptionsWhere<P>) : [];
    const porId = new Map(padres.map((p): [number, P] => [p.id, p]));
    for (const x of filas) x[destino] = porId.get(x[campoId] as number) ?? null;
    return lista;
}

export async function bloquearImagen(manager: EntityManager, id: number) {
    const imagen = await manager.findOne(Imagen, { where: { id }, lock: { mode: 'pessimistic_read' } });
    if (!imagen) throw new NotFoundException('Imagen no encontrado');
}

export async function bloquearActivo<T extends { id: number; activo: boolean }>(
    manager: EntityManager,
    entidad: EntityTarget<T>,
    id: number,
    etiqueta: string,
) {
    const registro = await manager.findOne(entidad, { where: { id } as FindOptionsWhere<T>, lock: { mode: 'pessimistic_read' } });
    if (!registro || !registro.activo) throw new NotFoundException(`${etiqueta} no encontrado`);
}

export function soloLoQueVino<T extends object>(dto: T): Partial<T> {
    return Object.fromEntries(Object.entries(dto).filter(([, valor]) => valor !== undefined)) as Partial<T>;
}
