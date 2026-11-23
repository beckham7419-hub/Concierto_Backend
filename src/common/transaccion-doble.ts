import { DataSource, EntityManager } from 'typeorm';

export function transaccionDoble<T>(
    bd: DataSource,
    bdTickets: DataSource,
    nivel: 'READ COMMITTED' | 'REPEATABLE READ',
    trabajo: (manager: EntityManager, managerTickets: EntityManager) => Promise<T>,
) {
    return bd.transaction(nivel, (manager) =>
        bdTickets.transaction(nivel, (managerTickets) => trabajo(manager, managerTickets)),
    );
}
