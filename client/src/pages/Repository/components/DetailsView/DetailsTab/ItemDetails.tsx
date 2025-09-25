/* eslint-disable react-hooks/exhaustive-deps, react/jsx-max-props-per-line, @typescript-eslint/no-explicit-any */
/**
 * ItemDetails
 *
 * This component renders details tab for Item-specific details used in DetailsTab component.
 */
import React, { useEffect } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Checkbox } from '@material-ui/core';
import clsx from 'clsx';
import { DebounceInput } from 'react-debounce-input';

import { Loader } from '../../../../../components';
import { ItemDetailFields } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';

import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import LabelTooltipText from '../../../../../components/controls/LabelTooltipText';

function ItemDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType, subtitle, onSubtitleUpdate, originalSubtitle } = props;

    const [ItemDetailsState, updateDetailField] = useDetailTabStore(state => [state.ItemDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ItemDetailsState);
    }, [ItemDetailsState]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eItem, name, value);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eItem, name, checked);
    };

    const itemData = data.getDetailsTabDataForObject?.Item;

    return (
        <Box style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
            <ItemFields
                disabled={disabled}
                ItemDetails={ItemDetailsState}
                itemData={itemData}
                subtitle={subtitle}
                originalSubtitle={originalSubtitle}
                onSubtitleUpdate={onSubtitleUpdate}
                setCheckboxField={setCheckboxField}
                onChange={onSetField}
            />
        </Box>
    );
}

type ItemFieldsProps = {
    disabled: boolean;
    ItemDetails: Partial<ItemDetailFields> | null | undefined;
    itemData: Partial<ItemDetailFields> | null | undefined;
    subtitle?: string;
    originalSubtitle?: string;
    onSubtitleUpdate?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    setCheckboxField: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // included for parity if more fields are added later
};

function ItemFields(props: ItemFieldsProps): React.ReactElement {
    const {
        disabled,
        ItemDetails,
        itemData,
        subtitle,
        originalSubtitle,
        onSubtitleUpdate,
        setCheckboxField
    } = props;

    const classes = useStyles();

    return (
        <TableContainer style={{ width: 'fit-content', paddingTop: '5px', paddingBottom: '5px' }}>
            <Table className={classes.table}>
                <TableBody>
                    {/* Subtitle */}
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            <LabelTooltipText
                                label='Subtitle'
                                labelTooltipTxt='This is the subtitle of this media asset.'
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <DebounceInput
                                element='input'
                                title='Subtitle-input'
                                value={subtitle}
                                type='string'
                                name='Subtitle'
                                onChange={onSubtitleUpdate as (event: React.ChangeEvent<HTMLInputElement>) => void}
                                className={clsx(classes.input, classes.datasetFieldInput)}
                                style={{
                                    height: 22,
                                    fontSize: '0.8rem',
                                    padding: '0px 10px',
                                    borderRadius: 5,
                                    border: '1px solid rgba(141, 171, 196, 0.4)',
                                    ...updatedFieldStyling(subtitle !== originalSubtitle)
                                }}
                            />
                        </TableCell>
                    </TableRow>

                    {/* Entire Subject */}
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            <LabelTooltipText
                                label='Entire Subject'
                                labelTooltipTxt='This indicates whether the media asset represents the entire assigned subject.'
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle' }}>
                            <Checkbox
                                className={classes.checkbox}
                                name='EntireSubject'
                                onChange={setCheckboxField}
                                checked={Boolean(ItemDetails?.EntireSubject)}
                                title='EntireSubject-input'
                                disabled={disabled}
                                size='small'
                                style={{
                                    ...updatedFieldStyling(
                                        // mirrors SubjectDetails updated marker logic
                                        (itemData && 'EntireSubject' in (itemData ?? {}))
                                            ? (ItemDetails?.EntireSubject !== (itemData as any)?.EntireSubject)
                                            : false
                                    )
                                }}
                                color='primary'
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ItemDetails;
