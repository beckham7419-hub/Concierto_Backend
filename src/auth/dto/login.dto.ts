import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { MaxBytes, minusculas } from '../../common/dto-ayudas.js';
import { PASSWORD_MAX } from '../../constantes.js';

export class LoginDto {
    @Transform(minusculas)
    @IsString()
    @IsNotEmpty()
    correo: string;

    @IsString()
    @IsNotEmpty()
    @MaxBytes(PASSWORD_MAX)
    contrasena: string;
}
