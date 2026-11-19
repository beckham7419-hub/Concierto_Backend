import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { minusculas, Opcional } from '../../common/dto-ayudas.js';
import { ESTADO_TICKET, ID_MAX, PAGINA_MAX, TICKETS_POR_PAGINA_MAX } from '../../constantes.js';

export class FiltrosTicketDto {
    @Opcional()
    @Transform(minusculas)
    @IsIn(Object.values(ESTADO_TICKET))
    estado?: string;

    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(ID_MAX)
    conciertoId?: number;

    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(PAGINA_MAX)
    pagina?: number;

    @Opcional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(TICKETS_POR_PAGINA_MAX)
    limite?: number;
}
