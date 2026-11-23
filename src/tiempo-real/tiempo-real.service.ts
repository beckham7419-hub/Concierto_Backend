import { Injectable } from '@nestjs/common';

@Injectable()
export class TiempoRealService {
    private readonly versiones = new Map<number, number>();
    private readonly esperas = new Map<number, Set<() => void>>();

    version(conciertoId: number) {
        let version = this.versiones.get(conciertoId);
        if (version === undefined) {
            version = Date.now();
            this.versiones.set(conciertoId, version);
        }
        return version;
    }

    notificar(conciertoId: number) {
        this.versiones.set(conciertoId, this.version(conciertoId) + 1);
        for (const despertar of this.esperas.get(conciertoId) ?? []) despertar();
    }

    esperar(conciertoId: number, version: number | undefined, ms: number, senal?: AbortSignal) {
        if (version === undefined || version !== this.version(conciertoId) || senal?.aborted) return Promise.resolve();

        return new Promise<void>((resolver) => {
            const lista = this.esperas.get(conciertoId) ?? new Set<() => void>();
            this.esperas.set(conciertoId, lista);

            const despertar = () => {
                clearTimeout(temporizador);
                senal?.removeEventListener('abort', despertar);
                lista.delete(despertar);
                if (lista.size === 0 && this.esperas.get(conciertoId) === lista) this.esperas.delete(conciertoId);
                resolver();
            };
            const temporizador = setTimeout(despertar, ms);
            temporizador.unref();
            senal?.addEventListener('abort', despertar, { once: true });
            lista.add(despertar);
        });
    }
}
