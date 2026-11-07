import { ArrayMinSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AsignarArtistasDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsInt({ each: true })
    @Min(1, { each: true })
    artistaIds: number[];
}
