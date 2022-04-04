/**
 * MetadataView
 *
 * This component renders metadata view used in RepositoryTreeView and RepositoryTreeHeader.
 */
import lodash from 'lodash';
import React, { useState } from 'react';
import { eMetadata } from '@dpo-packrat/common';
import { useTreeColumnsStore, useRepositoryStore } from '../../../../store';
import { GoArrowRight, GoArrowLeft } from 'react-icons/go';
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
    const [hoverColumn, setHoverColumn] = useState<null | eMetadata>(null);
    // Pull the generated MUI classes from TreeColumnsStore and assign the divs the appropriate class based on metadataColumn
    const [classes, updateOrder, columnOrder] = useTreeColumnsStore(state => [state.classes, state.updateOrder, state.order]);
    const [initializeTree, setLoading] = useRepositoryStore(state => [state.initializeTree, state.setLoading]);
    const iconStyle = { cursor: 'pointer' };

    const renderTreeColumns = (treeColumns: TreeViewColumn[]) => {
        return treeColumns.map((treeColumn: TreeViewColumn, index: number) => {
            const onMouseEnter = () => { if (header) setHoverColumn(metadataColumn); };
            const onMouseLeave = () => { if (header) setHoverColumn(null); };
            const onRightShift = async () => {
                if (treeColumns[treeColumns.length - 1].metadataColumn === metadataColumn) return;
                const currentInd = treeColumns.findIndex((element) => element.metadataColumn === metadataColumn);
                if (currentInd === -1) return;

                const nextInd = currentInd + 1;
                const currentCol = treeColumns[currentInd];
                const nextCol = treeColumns[nextInd];

                updateOrder(currentCol.metadataColumn, columnOrder[nextCol.metadataColumn]);
                updateOrder(nextCol.metadataColumn, columnOrder[currentCol.metadataColumn]);
                setLoading(true);
                await initializeTree();
            };
            const onLeftShift = async () => {
                if (treeColumns[0].metadataColumn === metadataColumn) return;
                const currentInd = treeColumns.findIndex((element) => element.metadataColumn === metadataColumn);
                if (currentInd <= 0) return;

                const prevInd = currentInd - 1;
                const currentCol = treeColumns[currentInd];
                const prevCol = treeColumns[prevInd];

                updateOrder(currentCol.metadataColumn, columnOrder[prevCol.metadataColumn]);
                updateOrder(prevCol.metadataColumn, columnOrder[currentCol.metadataColumn]);
                setLoading(true);
                await initializeTree();
            };
            const { label, metadataColumn } = treeColumn;
            return (
                <div
                    key={index}
                    className={clsx(makeStyles?.column, classes?.[metadataColumn])}
                    style={{ padding: header ? '10px' : '0px 10px', justifyContent: 'space-between' }}
                    id={`column-${label}`}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <span className={makeStyles?.text} title={header ? undefined : label} data-tooltip-position='bottom'>
                        {label}
                    </span>
                    {hoverColumn === metadataColumn &&(
                        <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                            {/* Limit arrow options based on start, last, or middle header position */}
                            {(treeColumns[0].metadataColumn !== metadataColumn) && <GoArrowLeft style={iconStyle} onClick={onLeftShift} />}
                            {(treeColumns[treeColumns.length - 1].metadataColumn !== metadataColumn) && <GoArrowRight style={iconStyle} onClick={onRightShift} />}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div style={{ display: 'flex' }}>
            {options}
            {renderTreeColumns(treeColumns)}
        </div>
    );
}

export default React.memo(MetadataView, lodash.isEqual);
