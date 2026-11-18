export const ROL = {
    ADMIN: 'administrador',
    CLIENTE: 'cliente',
} as const;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const MAX_FILAS = 26;
export const MAX_ASIENTOS_FILA = 50;

export const PRECIO_MIN = 10;
export const PRECIO_MAX = 100000;
export const MONTO_RECIBIDO_MAX = 1000000;

export const ESTADO_CONCIERTO = {
    PROGRAMADO: 'programado',
    CANCELADO: 'cancelado',
} as const;

export const ESTADO_TICKET = {
    PENDIENTE: 'pendiente',
    PAGADO: 'pagado',
    CANCELADO: 'cancelado',
    VENCIDO: 'vencido',
    USADO: 'usado',
} as const;

export const MAX_ASIENTOS_TICKET = 8;
export const MAX_TICKETS_PENDIENTES = 3;
export const HORAS_LIMITE_PAGO = 48;

export const LARGO_CLAVE = 8;
export const ALFABETO_CLAVE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const OCUPADO = 1;

export const ID_MAX = 2147483647;

export const MAX_NIVELES_BODY = 10;

export const IMAGEN_MAX_BYTES = 2 * 1024 * 1024;
export const IMAGEN_TIPOS = /^image\/(jpeg|png|webp)$/;
export const IMAGEN_NOMBRE_MAX = 255;

export const METODO_PAGO_INICIAL = 'Efectivo';

export const METODO_PAGO_TARJETA = 'Tarjeta';

export const STRIPE_LLAVE_PRUEBA = 'sk_test_';
export const STRIPE_SESION_PATRON = /^cs_test_[A-Za-z0-9_]+$/;
export const STRIPE_MONEDA = 'mxn';
export const STRIPE_MONTO_MINIMO = 10;
export const STRIPE_MINUTOS_SESION = 60;
export const STRIPE_MINUTOS_MINIMOS = 35;
export const STRIPE_MINUTOS_HOLGURA = 2;
export const STRIPE_TIMEOUT_MS = 15000;
export const STRIPE_REINTENTOS = 1;
export const STRIPE_MINUTOS_REUSO = 5;
export const STRIPE_SESIONES_REVISADAS = 500;
export const STRIPE_REVISION_TIMEOUT_MS = 5000;

export const RUTA_FRONT_PAGO_EXITO = '/pago/exito';
export const RUTA_FRONT_TICKETS = '/mis-tickets';

export const ESTADOS_MX = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
    'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas',
];
