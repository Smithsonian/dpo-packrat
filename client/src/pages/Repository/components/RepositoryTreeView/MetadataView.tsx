/**
 * MetadataView
 *
 * This component renders metadata view used in RepositoryTreeView and RepositoryTreeHeader.
 */
import lodash from 'lodash';
import React from 'react';
import { eMetadata } from '@dpo-packrat/common';
import { trimmedMetadataField } from '../../../../utils/repository';
import { useTreeColumnsStore } from '../../../../store';
import clsx from 'clsx';

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
    
    // Pull the generated MUI classes from TreeColumnsStore and assign the divs the appropriate class based on metadataColumn
    const [classes] = useTreeColumnsStore(state => [state.classes]);
    const renderTreeColumns = (treeColumns: TreeViewColumn[]) => {
        return treeColumns.map((treeColumn: TreeViewColumn, index: number) => {
            const { label, metadataColumn } = treeColumn;
            return (
                <div key={index} className={clsx(makeStyles?.column, classes?.[metadataColumn])} id={`column-${label}`}>
                    <span className={makeStyles?.text} title={header ? undefined : label} data-tooltip-position='bottom'>
                        {trimmedMetadataField(label, 14, 7)}
                    </span>
                </div>
            );
        })
    };

    return (
        <div style={{ display: 'flex' }}>
            {options}
            {renderTreeColumns(treeColumns)}
        </div>
    );
}

export default React.memo(MetadataView, lodash.isEqual);
