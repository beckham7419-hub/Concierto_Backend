import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';
import { MAX_ASIENTOS_TICKET } from '../../constantes.js';

export class CreateTicketDto {
    @IsInt()
    @Min(1)
    conciertoId: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(MAX_ASIENTOS_TICKET)
    @ArrayUnique()
    @IsInt({ each: true })
    @Min(1, { each: true })
    asientoIds: number[];
}
