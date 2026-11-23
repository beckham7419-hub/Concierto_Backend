import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { FORMATO_NOMBRE_PERSONA, MENSAJE_NOMBRE_PERSONA, PASSWORD_MAX, PASSWORD_MIN } from '../../constantes.js';
import { limpiar, MaxBytes, minusculas } from '../../common/dto-ayudas.js';

export class RegistroDto {
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Matches(FORMATO_NOMBRE_PERSONA, { message: MENSAJE_NOMBRE_PERSONA })
    nombre: string;

    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Matches(FORMATO_NOMBRE_PERSONA, { message: MENSAJE_NOMBRE_PERSONA })
    apellido: string;

    @Transform(minusculas)
    @IsEmail()
    @MaxLength(150)
    correo: string;

    @IsString()
    @MinLength(PASSWORD_MIN)
    @MaxLength(PASSWORD_MAX)
    @MaxBytes(PASSWORD_MAX)
    contrasena: string;

    @IsOptional()
    @Matches(/^\d{10}$/, { message: 'telefono must be a 10-digit string' })
    telefono?: string;
}
