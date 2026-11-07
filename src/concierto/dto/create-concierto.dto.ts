import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FechaConHora, limpiar } from '../../common/dto-ayudas.js';

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
}
