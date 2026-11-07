import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { limpiar, Opcional } from '../../common/dto-ayudas.js';

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
}
