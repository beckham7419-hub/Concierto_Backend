import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { minusculas, Opcional } from '../../common/dto-ayudas.js';
import { ESTADO_CONCIERTO } from '../../constantes.js';

export class FiltrosReporteDto {
    @Opcional()
    @Transform(minusculas)
    @IsIn(Object.values(ESTADO_CONCIERTO))
    estado?: string;
}
