import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { mayusculas } from '../../common/dto-ayudas.js';
import { LARGO_CLAVE } from '../../constantes.js';

export class CrearCheckoutDto {
    @Transform(mayusculas)
    @IsString()
    @Length(LARGO_CLAVE, LARGO_CLAVE)
    clave: string;
}
