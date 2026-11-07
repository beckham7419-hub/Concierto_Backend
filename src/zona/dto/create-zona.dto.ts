import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';
import { MAX_ASIENTOS_FILA, MAX_FILAS } from '../../constantes.js';

export class CreateZonaDto {
    @IsInt()
    @Min(1)
    recintoId: number;

    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    nombre: string;

    @IsInt()
    @Min(1)
    @Max(MAX_FILAS)
    filas: number;

    @IsInt()
    @Min(1)
    @Max(MAX_ASIENTOS_FILA)
    asientosPorFila: number;
}
