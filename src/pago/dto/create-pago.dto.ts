import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsPositive, IsString, Length, Max, Min } from 'class-validator';
import { DosDecimales, mayusculas } from '../../common/dto-ayudas.js';
import { LARGO_CLAVE, MONTO_RECIBIDO_MAX } from '../../constantes.js';

export class CreatePagoDto {
    @Transform(mayusculas)
    @IsString()
    @Length(LARGO_CLAVE, LARGO_CLAVE)
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
