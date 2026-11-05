import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX, PASSWORD_MIN } from '../../constantes.js';
import { limpiar, minusculas, Opcional } from '../../common/dto-ayudas.js';

export class UpdateUsuarioDto {
    @Opcional()
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre?: string;

    @Opcional()
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    apellido?: string;

    @Opcional()
    @Transform(minusculas)
    @IsEmail()
    @MaxLength(150)
    correo?: string;

    @Opcional()
    @IsString()
    @MinLength(PASSWORD_MIN)
    @MaxLength(PASSWORD_MAX)
    contrasena?: string;

    @IsOptional()
    @Matches(/^\d{10}$/, { message: 'telefono must be a 10-digit string' })
    telefono?: string | null;
}
