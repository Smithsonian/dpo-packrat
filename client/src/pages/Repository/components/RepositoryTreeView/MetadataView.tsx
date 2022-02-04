/**
 * MetadataView
 *
 * This component renders metadata view used in RepositoryTreeView and RepositoryTreeHeader.
 */
import lodash from 'lodash';
import React from 'react';
import { palette } from '../../../../theme';
import { eMetadata } from '@dpo-packrat/common';
import { computeMetadataViewWidth, trimmedMetadataField } from '../../../../utils/repository';

export type TreeViewColumn = {
    metadataColumn: eMetadata;
    label: string;
    size: number;
};

interface MetadataViewProps {
    header: boolean;
    treeColumns: TreeViewColumn[];
    options?: React.ReactNode;
    makeStyles?: { [key: string]: string };
}

function MetadataView(props: MetadataViewProps): React.ReactElement {
    const { header, treeColumns, options = null, makeStyles } = props;

    const width = computeMetadataViewWidth(treeColumns);

    const renderTreeColumns = (treeColumns: TreeViewColumn[]) =>
        treeColumns.map((treeColumn: TreeViewColumn, index: number) => {
            const { label, size } = treeColumn;
            const width = `${size}vw`;

            return (
                <div key={index} className={makeStyles?.column} style={{ width, color: palette.primary.dark, fontSize: undefined }}>
                    <span className={makeStyles?.text} title={header ? undefined : label} data-tooltip-position='bottom'>
                        {trimmedMetadataField(label, 14, 7)}
                    </span>
                </div>
            );
        });

    return (
        <div style={{ width, display: 'flex' }}>
            {options}
            {renderTreeColumns(treeColumns)}
        </div>
    );
}

export default React.memo(MetadataView, lodash.isEqual);
