import { TransformFnParams } from 'class-transformer';
import { ValidateIf } from 'class-validator';

export const limpiar = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value;

export const minusculas = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export const Opcional = () => ValidateIf((_objeto, valor) => valor !== undefined);
