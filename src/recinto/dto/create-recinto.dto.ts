import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { limpiar } from '../../common/dto-ayudas.js';

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
}
