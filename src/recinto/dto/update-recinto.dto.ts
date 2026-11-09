import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { limpiar, Opcional } from '../../common/dto-ayudas.js';
import { ID_MAX } from '../../constantes.js';

export class UpdateRecintoDto {
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
    @MaxLength(255)
    direccion?: string;

    @Opcional()
    @IsInt()
    @Min(1)
    ciudadId?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(ID_MAX)
    imagenId?: number | null;
}
