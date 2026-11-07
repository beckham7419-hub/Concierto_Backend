import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';

export class CreateCiudadDto {
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @IsInt()
    @Min(1)
    estadoId: number;
}
