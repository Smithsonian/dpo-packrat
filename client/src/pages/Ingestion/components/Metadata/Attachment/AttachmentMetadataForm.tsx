/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */
/**
 * Metadata - Attachment
 *
 * This component is a reusable form control component
 * that creates a dynamic list of additional inputs
 * used for attachments in ingestion
 */

import React from 'react';
import { Checkbox, TableContainer, TableBody, Table, TableRow, TableCell, Paper, Select, MenuItem, Typography } from '@material-ui/core';
import { useStyles } from '../../../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';
import { useVocabularyStore, VocabularyOption } from '../../../../../store';
import { DebounceInput } from 'react-debounce-input';
import clsx from 'clsx';

export interface metadataRow {
    name: string;
    label: string;
    type: 'string' | 'index' | 'boolean';
    index?: number;
}

interface AttachmentMetadataProps {
    metadatas: metadataRow[];
    metadataState: { [name: string]: boolean | string | number | undefined | null };
    setNameField: ({ target }: { target: any }) => void;
    setCheckboxField: ({ target }: { target: any }) => void;
}


function AttachmentMetadataForm(props: AttachmentMetadataProps): React.ReactElement {
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);
    const { metadatas, metadataState, setNameField, setCheckboxField } = props;
    const classes = useStyles();

    const rows = metadatas.map(({ type, label, name, index }) => {
        let content;
        if (type === 'boolean') {
            content = (
                <Checkbox
                    className={classes.checkbox}
                    name={name}
                    onChange={setCheckboxField}
                    checked={metadataState[name] as boolean}
                    title={`${name}-input`}
                    size='small'
                    style={{ height: '24px' }}
                />
            );
        } else if (type === 'index') {
            let options: VocabularyOption[] = [];
            if (index) {
                options = getEntries(index);
                if (!options || options.length === 0) {
                    options = [];
                    console.log(`AttachmentMetadataForm called for ${name} of type 'index', finding no entries`);
                }
            } else {
                console.log(`AttachmentMetadataForm called for ${name} of type 'index', without an index`);
            }
            content = (
                <Select
                    value={metadataState[name] as number}
                    name={name}
                    onChange={setNameField}
                    disableUnderline
                    className={clsx(classes.select, classes.datasetFieldSelect)}
                >
                    {options.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                </Select>
            );
        } else
            content = (
                <DebounceInput
                    element='input'
                    title={`${name}-input`}
                    value={metadataState[name] as string}
                    type='string'
                    name={name}
                    onChange={setNameField}
                    className={clsx(classes.input, classes.datasetFieldInput)}
                />
            );
        return (
            <TableRow className={classes.tableRow} key={name}>
                <TableCell className={classes.tableCell}>
                    <Typography className={classes.labelText}>{label}</Typography>
                </TableCell>
                <TableCell className={classes.tableCell}>
                    {content}
                </TableCell>
            </TableRow>
        );
    });

    return (
        <TableContainer component={Paper} className={classes.captureMethodTableContainer} style={{ paddingTop: '10px', paddingBottom: '10px' }} elevation={0}>
            <Table className={classes.table}>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default AttachmentMetadataForm;
