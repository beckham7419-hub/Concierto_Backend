import { NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';

export async function buscarActivo<T extends { id: number }>(
    repo: Repository<T>,
    id: number,
    etiqueta: string,
    soloActivo = true,
): Promise<T> {
    if (!Number.isInteger(id) || id < 1) throw new NotFoundException(`${etiqueta} no encontrado`);
    const registro: any = await repo.findOneBy({ id } as any);
    if (!registro || (soloActivo && registro.activo === false)) {
        throw new NotFoundException(`${etiqueta} no encontrado`);
    }
    return registro;
}

export async function adjuntar(lista: any[], campoId: string, repo: Repository<any>, destino: string) {
    const ids = [...new Set(lista.map((x) => x[campoId]).filter((v) => v != null))];
    const padres = ids.length ? await repo.findBy({ id: In(ids) }) : [];
    const porId = new Map(padres.map((p: any) => [p.id, p]));
    for (const x of lista) x[destino] = porId.get(x[campoId]) ?? null;
    return lista;
}

export function soloLoQueVino<T extends object>(dto: T): Partial<T> {
    return Object.fromEntries(Object.entries(dto).filter(([, valor]) => valor !== undefined)) as Partial<T>;
}
