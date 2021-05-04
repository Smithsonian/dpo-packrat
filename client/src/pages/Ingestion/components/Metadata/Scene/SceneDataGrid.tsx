/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { InputField, FieldType, ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        marginBottom: 10,
        '& > *': {
            width: 'fit-content',
            minWidth: '300px',
            height: '20px',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            }
        }
    }
}));

interface SceneData {
    Name: string;
    HasBeenQCd: boolean;
    IsOriented: boolean;
    CountScene: number;
    CountNode: number;
    CountCamera: number;
    CountLight: number;
    CountModel: number;
    CountMeta: number;
    CountSetup: number;
    CountTour: number;
}

interface SceneDataProps {
    sceneData: SceneData;
    name: string;
    hasBeenQCd: boolean;
    isOriented: boolean;
    setNameField: ({ target }: { target: EventTarget }) => void;
    setCheckboxField: ({ target }: { target: EventTarget }) => void;
}

function SceneDataGrid(props: SceneDataProps): React.ReactElement {
    const { sceneData, setCheckboxField, setNameField, name, hasBeenQCd, isOriented } = props;
    const { CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour } = sceneData;
    const classes = useStyles();
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box display='flex' flexDirection='column' className={classes.container}>
            <InputField required type='string' label='Name' value={name} name='name' onChange={setNameField} />

            <FieldType required label="Has been QC'd" direction='row' containerProps={rowFieldProps}>
                <Checkbox name='hasBeenQCd' checked={hasBeenQCd} color='primary' onChange={setCheckboxField} />
            </FieldType>

            <FieldType required label='Is Oriented' direction='row' containerProps={rowFieldProps}>
                <Checkbox name='isOriented' checked={isOriented} color='primary' onChange={setCheckboxField} />
            </FieldType>
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

export default SceneDataGrid;
