import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { Opcional } from '../../common/dto-ayudas.js';

export class FiltrosCarteleraDto {
    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    ciudadId?: number;

    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    generoId?: number;

    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    artistaId?: number;
}
