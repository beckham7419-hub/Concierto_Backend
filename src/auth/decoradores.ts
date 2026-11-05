import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICA = 'esPublica';
export const ROLES_KEY = 'roles';

export const Public = () => SetMetadata(ES_PUBLICA, true);

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
