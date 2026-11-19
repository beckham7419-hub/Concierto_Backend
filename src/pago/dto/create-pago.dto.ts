import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsPositive, IsString, Matches, Max, Min } from 'class-validator';
import { DosDecimales, mayusculas } from '../../common/dto-ayudas.js';
import { FORMATO_CLAVE, MONTO_RECIBIDO_MAX } from '../../constantes.js';

export class CreatePagoDto {
    @Transform(mayusculas)
    @IsString()
    @Matches(FORMATO_CLAVE, { message: 'clave must be a valid ticket key' })
    clave: string;

    @IsInt()
    @Min(1)
    metodoPagoId: number;

    @IsNumber()
    @IsPositive()
    @DosDecimales()
    @Max(MONTO_RECIBIDO_MAX)
    montoRecibido: number;
}
