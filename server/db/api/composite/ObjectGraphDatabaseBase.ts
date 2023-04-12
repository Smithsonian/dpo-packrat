import { SystemObjectIDType } from '../..';

export abstract class ObjectGraphDatabaseBase {
    public abstract alreadyProcessed(sourceType: SystemObjectIDType, relatedType: SystemObjectIDType | null): boolean;
    public abstract recordRelationship(parent: SystemObjectIDType, child: SystemObjectIDType): Promise<void>;
}