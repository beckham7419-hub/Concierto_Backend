import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';
import { STRIPE_SESION_PATRON } from '../../constantes.js';

export class ConfirmarPagoDto {
    @Transform(limpiar)
    @IsString()
    @MaxLength(255)
    @Matches(STRIPE_SESION_PATRON, { message: 'sessionId no es una sesion de pago valida' })
    sessionId: string;
}
