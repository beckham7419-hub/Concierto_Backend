import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FechaConHora, limpiar } from '../../common/dto-ayudas.js';
import { ID_MAX } from '../../constantes.js';

export class CreateConciertoDto {
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre: string;

    @IsOptional()
    @Transform(limpiar)
    @IsString()
    @MaxLength(1000)
    descripcion?: string | null;

    @FechaConHora()
    fecha: string;

    @IsInt()
    @Min(1)
    recintoId: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(ID_MAX)
    imagenId?: number | null;
}
