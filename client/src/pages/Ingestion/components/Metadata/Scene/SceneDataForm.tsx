/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { /*TextArea,*/ InputField, FieldType, ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        marginBottom: 10,
        '& > *': {
            width: 'fit-content',
            minWidth: '300px',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            },
            height: '20px'
        }
    }
}));

interface SceneData {
    Name: string;
    CountScene: number;
    CountNode: number;
    CountCamera: number;
    CountLight: number;
    CountModel: number;
    CountMeta: number;
    CountSetup: number;
    CountTour: number;
    EdanUUID: string | null;
    ApprovedForPublication: boolean;
    PosedAndQCd: boolean;
}

interface SceneDataProps {
    sceneData: SceneData;
    name: string;
    EdanUUID: string;
    approvedForPublication: boolean;
    posedAndQCd: boolean;
    idAssetVersion?: number;
    setNameField: ({ target }: { target: EventTarget }) => void;
    setCheckboxField: ({ target }: { target: EventTarget }) => void;
}

function SceneDataForm(props: SceneDataProps): React.ReactElement {
    const { sceneData, setCheckboxField, setNameField, name, approvedForPublication, posedAndQCd, EdanUUID /*, idAssetVersion*/ } = props;
    const classes = useStyles();
    if (!sceneData)
        return <Box></Box>;
    const { CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour } = sceneData;
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box display='flex' flexDirection='column' className={classes.container}>
            <InputField required type='string' label='Name' value={name} name='name' onChange={setNameField} />

            <FieldType required label='Approved for Publication' direction='row' containerProps={rowFieldProps}>
                <Checkbox name='approvedForPublication' checked={approvedForPublication} color='primary' onChange={setCheckboxField} />
            </FieldType>

            <FieldType required label="Posed and QC'd" direction='row' containerProps={rowFieldProps}>
                <Checkbox name='posedAndQCd' checked={posedAndQCd} color='primary' onChange={setCheckboxField} />
            </FieldType>

            <ReadOnlyRow label='EDAN UUID' value={EdanUUID} />
            <ReadOnlyRow label='Scene Count' value={CountScene} padding={15} />
            <ReadOnlyRow label='Node Count' value={CountNode} padding={15} />
            <ReadOnlyRow label='Camera Count' value={CountCamera} padding={15} />
            <ReadOnlyRow label='Light Count' value={CountLight} padding={15} />
            <ReadOnlyRow label='Model Count' value={CountModel} padding={15} />
            <ReadOnlyRow label='Meta Count' value={CountMeta} padding={15} />
            <ReadOnlyRow label='Setup Count' value={CountSetup} padding={15} />
            <ReadOnlyRow label='Tour Count' value={CountTour} padding={15} />
        </Box>
    );
}

export default SceneDataForm;
