import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { PASSWORD_MAX, PASSWORD_MIN } from '../../constantes.js';
import { limpiar, MaxBytes, Opcional } from '../../common/dto-ayudas.js';

export class ActualizarPerfilDto {
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

    @IsOptional()
    @Matches(/^\d{10}$/, { message: 'telefono must be a 10-digit string' })
    telefono?: string | null;

    @ValidateIf((dto: ActualizarPerfilDto) => dto.contrasenaNueva !== undefined)
    @IsString()
    @IsNotEmpty({ message: 'Escribe tu contraseña actual' })
    @MaxLength(PASSWORD_MAX)
    @MaxBytes(PASSWORD_MAX)
    contrasenaActual?: string;

    @Opcional()
    @IsString()
    @MinLength(PASSWORD_MIN)
    @MaxLength(PASSWORD_MAX)
    @MaxBytes(PASSWORD_MAX)
    contrasenaNueva?: string;
}
