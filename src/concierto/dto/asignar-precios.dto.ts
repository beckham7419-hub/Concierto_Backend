import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsInt, IsNumber, IsObject, IsPositive, Max, Min, ValidateNested } from 'class-validator';
import { DosDecimales } from '../../common/dto-ayudas.js';
import { PRECIO_MAX } from '../../constantes.js';

export class PrecioZonaDto {
    @IsInt()
    @Min(1)
    zonaId: number;

    @IsNumber()
    @IsPositive()
    @DosDecimales()
    @Max(PRECIO_MAX)
    precio: number;
}

export class AsignarPreciosDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique((item: PrecioZonaDto) => item.zonaId)
    @IsObject({ each: true })
    @ValidateNested({ each: true })
    @Type(() => PrecioZonaDto)
    precios: PrecioZonaDto[];
}
