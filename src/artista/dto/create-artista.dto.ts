import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';
import { ID_MAX } from '../../constantes.js';

export class CreateArtistaDto {
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @IsInt()
    @Min(1)
    generoId: number;

    @IsOptional()
    @Transform(limpiar)
    @IsString()
    @MaxLength(1000)
    descripcion?: string | null;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(ID_MAX)
    imagenId?: number | null;
}
