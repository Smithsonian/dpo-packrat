/**
 * Transaction-scoped buffer entry describing one pending audit row. Populated
 * by AuditFactory.emit during a wrapped transaction and flushed via
 * tx.audit.createMany(...) before commit.
 */
export type AuditBufferEntry = {
    idUser: number | null;
    AuditDate: Date;
    AuditType: number;
    DBObjectType: number | null;
    idDBObject: number | null;
    idSystemObject: number | null;
    Data: string | null;
    SystemActor: string | null;
    CorrelationId: string | null;
};
