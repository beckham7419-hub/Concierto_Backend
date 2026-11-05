import { TransformFnParams } from 'class-transformer';

export const limpiar = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value;

export const minusculas = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;
