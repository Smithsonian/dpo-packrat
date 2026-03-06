import { Metadata } from '../../db/api/Metadata';

export interface IIndexer {
    fullIndex(profiled?: boolean | undefined): Promise<boolean>;
    rebuildIndex(): Promise<boolean>;
    indexObject(idSystemObject: number): Promise<boolean>;
    indexMetadata(metadataList: Metadata[]): Promise<boolean>;
}
