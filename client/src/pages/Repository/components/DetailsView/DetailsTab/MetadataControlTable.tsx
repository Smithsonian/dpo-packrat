/**
 * MetadataControlTable
 *
 * This component renders the control table for metadata in repository details and subject creation.
 * This is the bottom table
 */

import React from 'react';
import { Box, Button, Table, TableHead, TableRow, TableCell, TableBody, TextField, Select, MenuItem, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useObjectMetadataStore, useLicenseStore, MetadataState, eObjectMetadataType, isRequired, noLabel } from '../../../../../store';
import { Metadata } from '../../../../../types/graphql';
// import { eVocabularySetID } from '@dpo-packrat/common';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { useEdanUnitsNamed } from '../../../hooks/useDetailsView';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import { sharedButtonProps } from '../../../../../utils/shared';
import clsx from 'clsx';


const useStyles = makeStyles(({ palette, typography }) => createStyles({
    btn: {
        ...sharedButtonProps,
        width: 'fit-content',
        marginBottom: '5px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    container: {
        backgroundColor: (type) => type === eObjectMetadataType.eSubjectCreation ? palette.primary.light : palette.secondary.light,
        borderRadius: 5
    },
    headerRow: {
        borderBottom: '1.5px solid black',
        margin: 0
    },
    headerCell: {
        padding: '1px 10px',
        fontWeight: 500
    },
    headerCellText: {
        fontWeight: 500
    },
    textField: {
        width: '100%',
        verticalAlign: 'bottom'
    },
    text: {
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        '& .MuiInputBase-input': {
            padding: '0.5px'
        }
    },
    autocompleteText: {
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        '& .MuiAutocomplete-input:first-child': {
            padding: '0 !important'
        }
    },
    table: {
        fontSize: '0.8rem'
    },
    cell: {
        padding: '1px 10px'
    },
    cellValue: {
        padding: '1px 2px 1px 10px'
    },
    cellStar: {
        padding: '1px 2px'
    },
    cellMinus: {
        padding: '1px 10px'
    },
    row: {
        height: 26
    }
}));

type MetadataControlTableProps = {
    type: eObjectMetadataType;
    metadataData: Metadata[];
};

type MetadataControlRowProps = {
    type: eObjectMetadataType;
    metadata: MetadataState;
    updateMetadata: (id: number, index: number, field: string, value: string, source?: string) => void;
    deleteMetadata: (id: number, index: number) => Promise<void>;
    index: number;
    licenses: string[];
    units: (string | null | undefined)[];
    options: string[];
    style: {[className: string]: string}
};

function MetadataControlTable(props: MetadataControlTableProps): React.ReactElement {
    const { type /* metadataData*/ } = props;
    const classes = useStyles(type);
    const { data } = useEdanUnitsNamed();
    const [getLicenses] = useLicenseStore(state => [state.getEntries]);
    const licenses = getLicenses().map(license => license.Name);
    const units = (data?.getEdanUnitsNamed.UnitEdan?.map(unitEdan => unitEdan.Name)) ?? [];
    const [metadata, updateMetadata, createMetadata, deleteMetadata, getAllMdmFieldsArr] = useObjectMetadataStore(state => [state.metadataControl, state.updateMetadata, state.createMetadata, state.deleteMetadata, state.getAllMdmFieldsArr]);
    const mdmFields: string[] = getAllMdmFieldsArr();

    const rows = metadata.map((row, index) => {
        return (
            <MetadataControlRow
                key={index}
                metadata={row}
                index={index}
                updateMetadata={updateMetadata}
                deleteMetadata={deleteMetadata}
                units={units}
                licenses={licenses}
                options={mdmFields}
                style={classes}
                type={type}
            />
        );
    });

    return (
        <React.Fragment>
            <Button
                className={classes.btn}
                variant='contained'
                color='primary'
                disableElevation
                onClick={() => createMetadata()}
            >
                Add Field
            </Button>
            {
                metadata.length > 0 ? (
                    <Box className={classes.container}>
                        <Table className={classes.table}>
                            <TableHead>
                                <TableRow className={classes.headerRow}>
                                    <TableCell width='25%' className={classes.headerCell}><Typography className={classes.headerCellText}>Name</Typography></TableCell>
                                    <TableCell width='20%' className={classes.headerCell}><Typography className={classes.headerCellText}>Label</Typography></TableCell>
                                    <TableCell className={classes.headerCell} width='55%' colSpan={3}>
                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                            <Typography className={classes.headerCellText}>Value</Typography>
                                            {(type !== eObjectMetadataType.eDetailView) &&
                                                <Typography style={{ fontStyle: 'italic', fontSize: '0.6rem' }}>
                                                    Fields marked with * are required<br />Names with Free Text (FT) may include a Label
                                                </Typography>}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows}
                            </TableBody>
                        </Table>
                    </Box>
                ) : null
            }
        </React.Fragment>
    );
}

function MetadataControlRow(props: MetadataControlRowProps): React.ReactElement {
    const { metadata, updateMetadata, deleteMetadata, index, licenses, units, options, style, type } = props;
    const { Name, Label, Value, idMetadata, isImmutable } = metadata;

    let valueInput = (
        <React.Fragment>
            <label htmlFor={`${index + Name}-value`} style={{ display: 'none' }}>Value for {Name}</label>
            <TextField id={`${index + Name}-value`}
                onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)}
                value={Value}
                InputProps={{ className: style.text }}
                style={{ width: '100%', verticalAlign: 'bottom' }}
            />
        </React.Fragment>
    );
    if (type === eObjectMetadataType.eDetailView) {
        return (
            <TableRow className={style.row}>
                <TableCell className={style.cell} >
                    <label htmlFor={`${index + Name}-name`} style={{ display: 'none' }}>Value for {Name}</label>
                    <TextField
                        id={`${index + Name}-name`}
                        onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Name', e.target.value)}
                        value={Name}
                        InputProps={{ className: style.text }}
                        style={{ width: '95%', verticalAlign: 'bottom' }}
                    />
                </TableCell>
                <TableCell className={style.cell}></TableCell>
                <TableCell className={style.cell}>{valueInput}</TableCell>
                <TableCell className={style.cell}></TableCell>
                <TableCell className={style.cell}><MdRemoveCircleOutline onClick={() => deleteMetadata(idMetadata ?? 0, index)} style={{ cursor: 'pointer' }} /></TableCell>
            </TableRow>
        );
    }

    if (Name === 'License') {
        valueInput = (
            <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} className={clsx(style.textField, style.text)} value={Value}>
                {licenses.map(license => (
                    <MenuItem value={license} key={license}>
                        {license}
                    </MenuItem>
                ))}
            </Select>
        );
    }
    if (Name === 'Unit') {
        valueInput = (
            <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} className={clsx(style.textField, style.text)} value={Value}>
                {units.map(unit => (
                    <MenuItem value={unit ?? ''} key={unit ?? ''}>
                        {unit}
                    </MenuItem>
                ))}
            </Select>
        );
    }
    const row = (
        <TableRow className={style.row}>
            <TableCell width='25%' className={style.cell}>
                {isImmutable ?
                    <Typography className={clsx(style.textField, style.text)}>{Name}</Typography> :
                    <Autocomplete
                        value={Name}
                        classes={{ inputRoot: clsx(style.autocompleteText, style.textField) }}
                        freeSolo
                        renderInput={(params) => <TextField {...params} style={{ verticalAlign: 'bottom' }} />}
                        options={options}
                        onInputChange={(_e, value) => {
                            if (value !== null) {
                                updateMetadata(idMetadata ?? 0, index, 'Name', value);
                            }
                        }}
                        onChange={(_e, value) => {
                            if (value !== null) {
                                updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', '');
                            }
                        }}
                    />
                }
            </TableCell>
            <TableCell width='20%' className={style.cell}>{noLabel.has(Name) ? null : (
                <React.Fragment>
                    <label htmlFor={`${index + Name}-label`} style={{ display: 'none' }}>Label</label>
                    <TextField
                        id={`${index + Name}-label`}
                        onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Label', e.target.value)}
                        value={Label}
                        InputProps={{ className: style.text }}
                        style={{ width: '95%', verticalAlign: 'bottom' }}
                    />
                </React.Fragment>
            )}
            </TableCell>
            <TableCell width='100%' className={style.cellValue}>{valueInput}</TableCell>
            <TableCell width='5' className={style.cellStar}>{isRequired.has(Name) ? '*' : null}</TableCell>
            <TableCell width='5' className={style.cellMinus}><MdRemoveCircleOutline onClick={() => deleteMetadata(idMetadata ?? 0, index)} style={{ cursor: 'pointer' }} /></TableCell>
        </TableRow>
    );
    return row;
}

export default MetadataControlTable;