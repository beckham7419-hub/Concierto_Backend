import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { Opcional } from '../../common/dto-ayudas.js';

export class CambiosAsientosDto {
    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    version?: number;
}
