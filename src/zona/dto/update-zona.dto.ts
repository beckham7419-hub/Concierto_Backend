import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { limpiar, Opcional } from '../../common/dto-ayudas.js';

export class UpdateZonaDto {
    @Opcional()
    @Transform(limpiar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    nombre?: string;
}
