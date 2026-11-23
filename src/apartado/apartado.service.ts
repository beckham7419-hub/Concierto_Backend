import { BadRequestException, ConflictException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MAX_ASIENTOS_TICKET, MINUTOS_APARTADO, REVISAR_APARTADOS_MS } from '../constantes.js';
import { TiempoRealService } from '../tiempo-real/tiempo-real.service.js';

type Sala = { asientos: Map<number, number>; plazos: Map<number, number> };

@Injectable()
export class ApartadoService implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly tiempoReal: TiempoRealService) {}

    private readonly salas = new Map<number, Sala>();
    private temporizador?: NodeJS.Timeout;

    onModuleInit() {
        this.temporizador = setInterval(() => this.vencer(), REVISAR_APARTADOS_MS);
        this.temporizador.unref();
    }

    onModuleDestroy() {
        clearInterval(this.temporizador);
    }

    private sala(conciertoId: number) {
        let sala = this.salas.get(conciertoId);
        if (!sala) {
            sala = { asientos: new Map(), plazos: new Map() };
            this.salas.set(conciertoId, sala);
        }
        return sala;
    }

    private limpiarPlazo(sala: Sala, usuarioId: number) {
        if (![...sala.asientos.values()].includes(usuarioId)) sala.plazos.delete(usuarioId);
    }

    private vencer() {
        const ahora = Date.now();
        for (const [conciertoId, sala] of this.salas) {
            let cambio = false;
            for (const [usuarioId, limite] of sala.plazos) {
                if (limite > ahora) continue;
                sala.plazos.delete(usuarioId);
                for (const [asientoId, dueno] of sala.asientos) {
                    if (dueno === usuarioId) sala.asientos.delete(asientoId);
                }
                cambio = true;
            }
            if (cambio) this.tiempoReal.notificar(conciertoId);
            if (sala.asientos.size === 0) this.salas.delete(conciertoId);
        }
    }

    duenoDe(conciertoId: number, asientoId: number) {
        return this.salas.get(conciertoId)?.asientos.get(asientoId);
    }

    deUsuario(usuarioId: number, conciertoId: number) {
        const asientos = this.salas.get(conciertoId)?.asientos ?? new Map<number, number>();
        return [...asientos].filter(([, dueno]) => dueno === usuarioId).map(([asientoId]) => asientoId);
    }

    plazoDe(usuarioId: number, conciertoId: number) {
        const limite = this.salas.get(conciertoId)?.plazos.get(usuarioId);
        return limite === undefined ? null : new Date(limite);
    }

    hayDeOtros(usuarioId: number, conciertoId: number, asientoIds: number[]) {
        return asientoIds.some((asientoId) => {
            const dueno = this.duenoDe(conciertoId, asientoId);
            return dueno !== undefined && dueno !== usuarioId;
        });
    }

    apartar(usuarioId: number, conciertoId: number, asientoId: number) {
        const sala = this.sala(conciertoId);
        const dueno = sala.asientos.get(asientoId);
        if (dueno !== undefined && dueno !== usuarioId) {
            throw new ConflictException('Ese asiento lo esta apartando otra persona');
        }
        if (dueno === undefined) {
            if (this.deUsuario(usuarioId, conciertoId).length >= MAX_ASIENTOS_TICKET) {
                throw new BadRequestException(`Maximo ${MAX_ASIENTOS_TICKET} asientos por ticket`);
            }
            sala.asientos.set(asientoId, usuarioId);
            if (!sala.plazos.has(usuarioId)) sala.plazos.set(usuarioId, Date.now() + MINUTOS_APARTADO * 60 * 1000);
            this.tiempoReal.notificar(conciertoId);
        }
        return this.plazoDe(usuarioId, conciertoId);
    }

    soltar(usuarioId: number, conciertoId: number, asientoId: number) {
        const sala = this.salas.get(conciertoId);
        if (sala?.asientos.get(asientoId) === usuarioId) {
            sala.asientos.delete(asientoId);
            this.limpiarPlazo(sala, usuarioId);
            this.tiempoReal.notificar(conciertoId);
        }
        return this.plazoDe(usuarioId, conciertoId);
    }

    soltarTodos(usuarioId: number, conciertoId: number) {
        const sala = this.salas.get(conciertoId);
        if (!sala) return;
        const propios = this.deUsuario(usuarioId, conciertoId);
        for (const asientoId of propios) sala.asientos.delete(asientoId);
        sala.plazos.delete(usuarioId);
        if (propios.length > 0) this.tiempoReal.notificar(conciertoId);
    }

    consumir(conciertoId: number, asientoIds: number[]) {
        const sala = this.salas.get(conciertoId);
        if (sala) {
            for (const asientoId of asientoIds) {
                const dueno = sala.asientos.get(asientoId);
                if (dueno === undefined) continue;
                sala.asientos.delete(asientoId);
                this.limpiarPlazo(sala, dueno);
            }
        }
        this.tiempoReal.notificar(conciertoId);
    }

    purgarConcierto(conciertoId: number) {
        this.salas.delete(conciertoId);
        this.tiempoReal.notificar(conciertoId);
    }
}
