/**
 * Type resolver for Metadata
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as COL from '../../../../../collections/interface';

const Metadata = {
    AssetVersionValue: async (parent: Parent): Promise<DBAPI.AssetVersion | null> => {
        return parent.idAssetVersionValue ? await DBAPI.AssetVersion.fetch(parent.idAssetVersionValue) : null;
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return parent.idSystemObject ? await DBAPI.SystemObject.fetch(parent.idSystemObject) : null;
    },
    SystemObjectParent: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return parent.idSystemObjectParent ? await DBAPI.SystemObject.fetch(parent.idSystemObjectParent) : null;
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return parent.idUser ? await DBAPI.User.fetch(parent.idUser) : null;
    },
    VMetadataSource: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return parent.idVMetadataSource ? await DBAPI.Vocabulary.fetch(parent.idVMetadataSource) : null;
    },
    Label: (parent: Parent): string => {
        const { label, content } = computeLabelAndContent(parent);
        content;
        return label;
    },
    Value: (parent: Parent): string => {
        const { label, content } = computeLabelAndContent(parent);
        label;
        return content;
    },
};

function computeLabelAndContent(parent: Parent): { label: string, content: string } {
    let value: string | undefined | null = parent.ValueShort;
    if (!value)
        value = parent.ValueExtended;
    return COL.parseEdanMetadata(value ?? '');
}

export default Metadata;
