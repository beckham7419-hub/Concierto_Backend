import { IsInt, Min } from 'class-validator';
import { RegistroDto } from '../../auth/dto/registro.dto.js';

export class CreateUsuarioDto extends RegistroDto {
    @IsInt()
    @Min(1)
    rolId: number;
}
