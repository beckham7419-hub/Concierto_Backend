import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MAX_NIVELES_BODY } from '../constantes.js';

@Injectable()
export class SoloObjetoPipe implements PipeTransform {
    transform(valor: any, metadata: ArgumentMetadata) {
        if (metadata.type !== 'body') return valor;
        if (Array.isArray(valor)) throw new BadRequestException('El body debe ser un objeto');
        if (this.contarNiveles(valor) > MAX_NIVELES_BODY) throw new BadRequestException('El body tiene demasiados niveles');
        return valor;
    }

    private contarNiveles(valor: unknown) {
        let nivel: object[] = typeof valor === 'object' && valor !== null ? [valor] : [];
        let niveles = 0;
        while (nivel.length > 0 && niveles <= MAX_NIVELES_BODY) {
            niveles++;
            const siguiente: object[] = [];
            for (const dato of nivel) {
                for (const hijo of Object.values(dato)) {
                    if (typeof hijo === 'object' && hijo !== null) siguiente.push(hijo);
                }
            }
            nivel = siguiente;
        }
        return niveles;
    }
}
