import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class BdFilter implements ExceptionFilter {
    catch(error: any, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ statusCode: 409, message: 'Ya existe un registro igual o el asiento ya esta ocupado' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ statusCode: 400, message: 'Referencia inexistente' });
        }
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ statusCode: 409, message: 'Esta en uso, no se puede quitar' });
        }
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            return res.status(409).json({ statusCode: 409, message: 'Otra persona estaba apartando lo mismo al mismo tiempo, intenta de nuevo' });
        }

        console.error('BD:', error.code, error.sqlMessage);
        return res.status(500).json({ statusCode: 500, message: 'Error interno' });
    }
}
