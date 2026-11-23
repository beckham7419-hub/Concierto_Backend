import { ValidationError, ValidationPipe } from '@nestjs/common';

const TRADUCCIONES: [RegExp, string][] = [
    [/^(\S+) must be a string$/, '$1 debe ser texto'],
    [/^(\S+) should not be empty$/, '$1 es obligatorio'],
    [/^(\S+) must be an integer number$/, '$1 debe ser un numero entero'],
    [/^(\S+) must be a number conforming to the specified constraints$/, '$1 debe ser un numero'],
    [/^(\S+) must be a positive number$/, '$1 debe ser mayor que 0'],
    [/^(\S+) must not be less than (\S+)$/, '$1 no puede ser menor que $2'],
    [/^(\S+) must not be greater than (\S+)$/, '$1 no puede ser mayor que $2'],
    [/^(\S+) must be longer than or equal to (\d+) characters$/, '$1 debe tener al menos $2 caracteres'],
    [/^(\S+) must be shorter than or equal to (\d+) characters$/, '$1 no puede tener mas de $2 caracteres'],
    [/^(\S+) must be one of the following values: (.+)$/, '$1 debe ser uno de estos valores: $2'],
    [/^(\S+) must be an email$/, 'El $1 no es valido'],
    [/^(\S+) must be an array$/, '$1 debe ser una lista'],
    [/^(\S+) must contain at least 1 elements$/, '$1 debe tener al menos 1 elemento'],
    [/^(\S+) must contain at least (\d+) elements$/, '$1 debe tener al menos $2 elementos'],
    [/^(\S+) must contain no more than (\d+) elements$/, '$1 no puede tener mas de $2 elementos'],
    [/^All (\S+)'s elements must be unique$/, '$1 no puede tener elementos repetidos'],
    [/^(\S+) must be an object$/, '$1 debe ser un objeto'],
    [/^nested property (\S+) must be either object or array$/, '$1 debe ser un objeto o una lista'],
    [/^(\S+) must be a valid ISO 8601 date string$/, '$1 debe ser una fecha valida'],
    [/^(\S+) must include the date and the time$/, '$1 debe incluir la fecha y la hora'],
    [/^(\S+) must have at most 2 decimal places$/, '$1 puede tener maximo 2 decimales'],
    [/^(\S+) must not be longer than (\d+) bytes$/, 'La contraseña es demasiado larga (maximo $2 bytes: los acentos y emojis ocupan mas de uno)'],
    [/^(\S+) must be a 10-digit string$/, '$1 debe tener 10 digitos'],
    [/^(\S+) must be a valid ticket key$/, '$1 no es una clave de ticket valida'],
    [/^(\S+) must match (.+) regular expression$/, '$1 no tiene el formato correcto'],
    [/^(\S+) should not be null or undefined$/, '$1 es obligatorio'],
    [/^property (.+) should not exist$/s, '$1 no esta permitido'],
    [/^an unknown value was passed to the validate function$/, 'El body no es valido'],
];

const traducir = (texto: string) => {
    const partes = /^((?:[^\s.]+\.)*)(each value in )?(.*)$/s.exec(texto);
    if (!partes) return texto;
    const [, ruta, cada, mensaje] = partes;
    for (const [patron, traduccion] of TRADUCCIONES) {
        if (patron.test(mensaje)) {
            return ruta + (cada ? 'cada valor de ' : '') + mensaje.replace(patron, traduccion);
        }
    }
    return texto;
};

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export class ValidacionPipe extends ValidationPipe {
    protected flattenValidationErrors(errores: ValidationError[]) {
        return super.flattenValidationErrors(errores).map((texto) => conMayuscula(traducir(texto)));
    }
}
