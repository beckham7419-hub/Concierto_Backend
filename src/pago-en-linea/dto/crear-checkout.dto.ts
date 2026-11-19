import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { mayusculas } from '../../common/dto-ayudas.js';
import { FORMATO_CLAVE } from '../../constantes.js';

export class CrearCheckoutDto {
    @Transform(mayusculas)
    @IsString()
    @Matches(FORMATO_CLAVE, { message: 'clave must be a valid ticket key' })
    clave: string;
}
