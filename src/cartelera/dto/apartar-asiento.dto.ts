import { IsInt, Min } from 'class-validator';

export class ApartarAsientoDto {
    @IsInt()
    @Min(1)
    asientoId: number;
}
