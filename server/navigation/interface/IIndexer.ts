export interface IIndexer {
    fullIndex(profiled?: boolean | undefined): Promise<boolean>;
    indexObject(idSystemObject: number): Promise<boolean>;
}
