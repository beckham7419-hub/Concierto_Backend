import { applyDecorators } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';
import { buildMessage, IsISO8601, Matches, ValidateBy, ValidateIf, ValidationOptions } from 'class-validator';

export const limpiar = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value;

export const minusculas = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export const Opcional = () => ValidateIf((_objeto, valor) => valor !== undefined);

export const FechaConHora = () =>
    applyDecorators(
        Matches(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/, { message: '$property must include the date and the time' }),
        IsISO8601({ strict: true }),
    );

export const DosDecimales = (opciones?: ValidationOptions) =>
    ValidateBy(
        {
            name: 'dosDecimales',
            validator: {
                validate: (valor) => typeof valor === 'number' && Math.round(valor * 100) / 100 === valor,
                defaultMessage: buildMessage((prefijo) => prefijo + '$property must have at most 2 decimal places', opciones),
            },
        },
        opciones,
    );
