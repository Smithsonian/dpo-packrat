/**
 * MetadataControlTable
 *
 * This component renders the control table for metadata in repository details and subject creation.
 * This is the bottom table
 */

import React, { useEffect } from 'react';
import { Box, Button, Table, TableHead, TableRow, TableCell, TableBody, TextField, Select, MenuItem, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useObjectMetadataStore, useVocabularyStore, useLicenseStore, MetadataState, eObjectMetadataType, VocabularyOption } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { useAllUnits } from '../../../hooks/useDetailsView';
import { makeStyles } from '@material-ui/core/styles';
import { sharedButtonProps } from '../../../../../utils/shared';


const useStyles = makeStyles(({ palette }) => ({
    btn: {
        ...sharedButtonProps,
        width: 'fit-content',
        marginBottom: '2px'
    },
    container: {
        backgroundColor: palette.secondary.light,
        marginTop: '2px'
    },
    headerRow: {
        borderBottom: '1.5px solid black'
    },
    tableBanner: {
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    textField: {
        width: '90%',
        borderBottom: 'rgb(118, 118, 118)'
    }
}));

type MetadataControlTableProps = {
    type: eObjectMetadataType;
};

type MetadataControlRowProps = {
    metadata: MetadataState;
    updateMetadata: (id: number, index: number, field: string, value: string) => void;
    deleteMetadata: (id: number, index: number) => Promise<void>;
    index: number;
    licenses: string[];
    units: string[];
    mdmFields: VocabularyOption[];
    style: {[className: string]: string}
};

/*
    1) xThe parent will decide how it wants to initialize the state
        -subject view
        xsubject creation
        -detail view
    2) The MetadataControlTable and MetadataDisplayTable will both be hooked to the states initialized in the state store
        xcontrol
        -display
    3) Initialize the states appropriately
        -subject view
        xsubject creation
        -detail view
    4) When update or creation is ready, we'll import the objectMetadata store and invoke getAllMetadataEntries there
        -subject view
        xsubject creation
        -detail view
    5) Upon success or unmounting of the component, we want to clear the state store
        -subject view
        xsubject creation
        -detail view
    6) Style
*/

/*
    Styling:
        font and font size
*/

function MetadataControlTable(props: MetadataControlTableProps): React.ReactElement {
    const { type } = props;
    const classes = useStyles();
    const { data } = useAllUnits();
    const [getLicenses] = useLicenseStore(state => [state.getEntries]);
    const licenses = getLicenses().map(license => license.Name);
    const units = data?.getUnitsFromNameSearch?.Units.map(unit => unit.Name) ?? [];
    const [metadata, updateMetadata, createMetadata, deleteMetadata, initializeMetadata] = useObjectMetadataStore(state => [state.metadataControl, state.updateMetadata, state.createMetadata, state.deleteMetadata, state.initializeMetadata]);
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);
    const entries = getEntries(eVocabularySetID.eEdanMDMFields);

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
                mdmFields={entries}
                style={classes}
            />
        );
    });

    useEffect(() => {
        initializeMetadata(type);
    }, [type, initializeMetadata]);

    return (
        <React.Fragment>
            <Box className={classes.container}>
                <Box className={classes.tableBanner}>
                    <Typography>Fields marked with * are required</Typography>
                </Box>
                <Table>
                    <TableHead>
                        <TableRow className={classes.headerRow}>
                            <TableCell width='20%'>Name</TableCell>
                            <TableCell width='20%'>Label</TableCell>
                            <TableCell width='45%'>Value</TableCell>
                            <TableCell width='5%'></TableCell>
                            <TableCell width='5%'></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows}
                    </TableBody>
                </Table>
            </Box>
            <Button className={classes.btn} variant='contained' color='primary' onClick={() => createMetadata()}>Add Field</Button>
        </React.Fragment>
    );
}

function MetadataControlRow(props: MetadataControlRowProps): React.ReactElement {
    const { metadata, updateMetadata, deleteMetadata, index, licenses, units, mdmFields, style } = props;
    const { Name, Label, Value, idMetadata, isImmutable } = metadata;
    /*
        Case 1: Required, No Label, No Remove
            -Unit has a select of units
            -License has a select of licenses
        Case 2: Not Required, No Label, No Remove
        Case 3: Not Required, No Label, Remove
        Case 4: Not Required, Label, Remove
            -includes any other metadata type
    */
    const isRequired = new Set(['Label', 'Title', 'Record ID', 'Unit', 'Access', 'License']);
    const noLabel = new Set(['Label', 'Title', 'Record ID', 'Unit', 'Access', 'License', 'License Text', 'Object Type', 'Date', 'Place', 'Topic']);
    const noRemove = new Set(['Label', 'Title', 'Record ID', 'Unit', 'Access', 'License', 'License Text']);

    let valueInput = <TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)} value={Value} />;

    if (Name === 'License') {
        valueInput = (
            <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} style={{ width: '90%' }} value={Value}>
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
            <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} style={{ width: '90%' }} value={Value}>
                {units.map(unit => (
                    <MenuItem value={unit} key={unit}>
                        {unit}
                    </MenuItem>
                ))}
            </Select>
        );
    }
    const row = (
        <TableRow>
            <TableCell>
                {isImmutable ? <Typography>{Name}</Typography> : <Autocomplete freeSolo renderInput={(params) => <TextField className={style.textField} {...params} />} options={mdmFields.map((option) => option.Term)} onInputChange={(_e, value) => { updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', ''); }} />}
            </TableCell>
            <TableCell>{noLabel.has(Name) ? null : <TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Label', e.target.value)} value={Label} />}</TableCell>
            <TableCell>{valueInput}</TableCell>
            <TableCell>{isRequired.has(Name) ? '*' : null}</TableCell>
            <TableCell>{noRemove.has(Name) ? null : <MdRemoveCircleOutline onClick={() => deleteMetadata(idMetadata ?? 0, index)} style={{ cursor: 'pointer' }} />}</TableCell>
        </TableRow>
    );

    // const setCase1 = new Set(['Label', 'Title', 'Record ID', 'Unit', 'Access', 'License']);
    // const setCase2 = new Set(['License Text']);
    // const setCase3 = new Set(['Object Type', 'Date', 'Place', 'Topic']);
    // const setCase4 = new Set(['Identifier (FT)', 'Data Source (FT)', 'Date (FT)', 'Name (FT)', 'Object Rights (FT)', 'Place (FT)', 'Taxonomic Name (FT)', 'Notes (FT)', 'Physical Description (FT)'])
    // if (setCase1.has(Name)) {
    //     let value = <TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)} value={Value}/>

    //     if (Name === 'License') {
    //         value = (
    //             <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} style={{ width: '80%' }} value={Value}>
    //                 {licenses.map(license => (
    //                     <MenuItem value={license} key={license}>
    //                         {license}
    //                     </MenuItem>
    //                 ))}
    //             </Select>
    //         );
    //     }
    //     if (Name === 'Unit') {
    //         value = (
    //             <Select onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value as string)} style={{ width: '80%' }} value={Value}>
    //                 {units.map(unit => (
    //                     <MenuItem value={unit} key={unit}>
    //                         {unit}
    //                     </MenuItem>
    //                 ))}
    //             </Select>
    //         );
    //     }
    //     row = (
    //         <TableRow>
    //             <TableCell>
    //                 {isImmutable ? <Typography>{Name}</Typography> : <Autocomplete freeSolo renderInput={(params) => <TextField className={style.textField} {...params} />} options={entries.map((option) => option.Term)} onInputChange={(_e, value) => { updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', ''); }} />}
    //             </TableCell>
    //             <TableCell></TableCell>
    //             <TableCell>{value}</TableCell>
    //             <TableCell>*</TableCell>
    //             <TableCell></TableCell>
    //         </TableRow>
    //     );
    // } else if (setCase2.has(Name)) {
    //     row = (
    //         <TableRow>
    //             <TableCell>
    //                 {isImmutable ? <Typography>{Name}</Typography> : <Autocomplete freeSolo renderInput={(params) => <TextField className={style.textField} {...params} />} options={entries.map((option) => option.Term)} onInputChange={(_e, value) => { updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', ''); }} />}
    //             </TableCell>
    //             <TableCell></TableCell>
    //             <TableCell><TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)} value={Value}/></TableCell>
    //             <TableCell></TableCell>
    //             <TableCell></TableCell>
    //         </TableRow>
    //     );
    // } else if (setCase3.has(Name)) {
    //     row = (
    //         <TableRow>
    //             <TableCell>
    //                 <Autocomplete freeSolo renderInput={(params) => <TextField className={style.textField} {...params} />} options={entries.map((option) => option.Term)} onInputChange={(_e, value) => { updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', ''); }} />
    //             </TableCell>
    //             <TableCell></TableCell>
    //             <TableCell><TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)} value={Value}/></TableCell>
    //             <TableCell></TableCell>
    //             <TableCell><MdRemoveCircleOutline onClick={() => deleteMetadata(idMetadata ?? 0, index)} style={{ cursor: 'pointer' }}/></TableCell>
    //         </TableRow>
    //     );
    // } else {
    //     row = (
    //         <TableRow>
    //             <TableCell>
    //                 <Box display='flex' className={style.textField}>
    //                     <Autocomplete freeSolo renderInput={(params) => <TextField {...params} ></TextField>} options={entries.map((option) => option.Term)} onInputChange={(_e, value) => { updateMetadata(idMetadata ?? 0, index, 'Name', value); updateMetadata(idMetadata ?? 0, index, 'Value', ''); updateMetadata(idMetadata ?? 0, index, 'Label', ''); }} style={{ width: '90%' }} />
    //                     {/* <ArrowDropDownIcon /> */}
    //                 </Box>
    //             </TableCell>
    //             <TableCell><TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Label', e.target.value)} value={Label}/></TableCell>
    //             <TableCell><TextField className={style.textField} onChange={(e) => updateMetadata(idMetadata ?? 0, index, 'Value', e.target.value)} value={Value}/></TableCell>
    //             <TableCell></TableCell>
    //             <TableCell><MdRemoveCircleOutline onClick={() => deleteMetadata(idMetadata ?? 0, index)} style={{ cursor: 'pointer' }}/></TableCell>
    //         </TableRow>
    //     );
    // }
    return row;
}

export default MetadataControlTable;