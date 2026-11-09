import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';
import { ID_MAX } from '../../constantes.js';

export class CreateRecintoDto {
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    direccion: string;

    @IsInt()
    @Min(1)
    ciudadId: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(ID_MAX)
    imagenId?: number | null;
}
