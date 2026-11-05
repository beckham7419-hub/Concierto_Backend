import { BadRequestException, HttpException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function manejarError(error: unknown, mensaje: string): never {
    if (error instanceof HttpException || error instanceof QueryFailedError) throw error;
    console.error('SERVICE:', error);
    throw new BadRequestException(mensaje);
}
