import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { limpiar, Opcional } from '../../common/dto-ayudas.js';

export class UpdateCiudadDto {
    @Opcional()
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre?: string;

    @Opcional()
    @IsInt()
    @Min(1)
    estadoId?: number;
}
