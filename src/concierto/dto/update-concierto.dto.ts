import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FechaConHora, limpiar, Opcional } from '../../common/dto-ayudas.js';

export class UpdateConciertoDto {
    @Opcional()
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre?: string;

    @IsOptional()
    @Transform(limpiar)
    @IsString()
    @MaxLength(1000)
    descripcion?: string | null;

    @Opcional()
    @FechaConHora()
    fecha?: string;

    @Opcional()
    @IsInt()
    @Min(1)
    recintoId?: number;
}
