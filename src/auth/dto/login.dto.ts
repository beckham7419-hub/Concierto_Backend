import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { minusculas } from '../../common/dto-ayudas.js';

export class LoginDto {
    @Transform(minusculas)
    @IsString()
    @IsNotEmpty()
    correo: string;

    @IsString()
    @IsNotEmpty()
    contrasena: string;
}
