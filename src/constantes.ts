export const ROL = {
    ADMIN: 'administrador',
    CLIENTE: 'cliente',
} as const;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const MAX_FILAS = 26;
export const MAX_ASIENTOS_FILA = 50;

export const PRECIO_MAX = 100000;

export const ESTADO_CONCIERTO = {
    PROGRAMADO: 'programado',
    CANCELADO: 'cancelado',
} as const;

export const METODO_PAGO_INICIAL = 'Efectivo';

export const ESTADOS_MX = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
    'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas',
];
