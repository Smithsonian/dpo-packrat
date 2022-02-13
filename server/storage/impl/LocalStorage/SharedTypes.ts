import * as path from 'path';

export const OCFLStorageRootNamasteFilename: string = '0=ocfl_1.0';
export const OCFLStorageRootLayoutFilename: string = 'ocfl_layout.json';
export const OCFLStorageRootSpecFilename: string = 'ocfl_1.0.html';

export const OCFLDigestAlgorithm: string = 'sha512';

export const OCFLStorageObjectNamasteFilename: string = '0=ocfl_object_1.0';
export const OCFLStorageObjectContentFolder: string = 'content';
export const OCFLStorageObjectInventoryFilename: string = 'inventory.json';
export const OCFLStorageObjectInventoryDigestFilename: string = 'inventory.json.' + OCFLDigestAlgorithm;

export const OCFLSourceDocsPath: string = path.join(__dirname, '../../../assets/storage');

export const OCFLMetadataFilename: string = '0=metadata.json';