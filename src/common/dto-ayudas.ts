import { applyDecorators } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';
import { buildMessage, IsISO8601, Matches, ValidateBy, ValidateIf, ValidationOptions } from 'class-validator';

const SE_VE = /(?![\u115F\u1160\u2800\u3164\uFFA0])[\p{L}\p{N}\p{P}\p{S}]/u;

export const limpiar = ({ value }: TransformFnParams) => {
    if (typeof value !== 'string') return value;
    const texto = value.trim();
    return SE_VE.test(texto) ? texto : '';
};

export const minusculas = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export const mayusculas = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value;

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
