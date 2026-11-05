import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SoloObjetoPipe implements PipeTransform {
    transform(valor: any, metadata: ArgumentMetadata) {
        if (metadata.type === 'body' && Array.isArray(valor)) {
            throw new BadRequestException('El body debe ser un objeto');
        }
        return valor;
    }
}
