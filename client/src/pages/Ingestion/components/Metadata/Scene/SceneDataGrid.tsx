import React from 'react';
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { InputField, FieldType, ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface SceneData {
    hasBeenQCd: boolean;
    isOriented: boolean;
    sceneCount: number;
    nodeCount: number;
    cameraCount: number;
    lightCount: number;
    modelCount: number;
    metaCount: number;
    setupCount: number;
    tourCount: number;
    setNameField?: () => void;
    setCheckboxField?: () => void;
}

interface SceneDataProps {
    sceneData: SceneData;
}

function SceneDataGrid(props: SceneDataProps): React.ReactElement {
    const { sceneData } = props;
    const { hasBeenQCd, isOriented, sceneCount, nodeCount, cameraCount, lightCount, modelCount, metaCount, setupCount, tourCount } = sceneData;
    const classes = useStyles();
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box display='flex' flexDirection='column' className={classes.container}>
            <InputField
                required
                type='string'
                label='Name'
                value={'Sample'}
                name='name'
                onChange={() => {
                    console.log('name change');
                }}
            />

            <FieldType required label={"Has been QC'd"} direction='row' containerProps={rowFieldProps}>
                <Checkbox
                    name='hasBeenQCd'
                    checked={hasBeenQCd}
                    color='primary'
                    onChange={() => {
                        console.log('check');
                    }}
                />
            </FieldType>

            <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                <Checkbox
                    name='authoritative'
                    checked={isOriented}
                    color='primary'
                    onChange={() => {
                        console.log('check');
                    }}
                />
            </FieldType>
            <ReadOnlyRow label='Scene Count' value={sceneCount} />
            <ReadOnlyRow label='Node Count' value={nodeCount} />
            <ReadOnlyRow label='Camera Count' value={cameraCount} />
            <ReadOnlyRow label='Light Count' value={lightCount} />
            <ReadOnlyRow label='Model Count' value={modelCount} />
            <ReadOnlyRow label='Meta Count' value={metaCount} />
            <ReadOnlyRow label='Setup Count' value={setupCount} />
            <ReadOnlyRow label='Tour Count' value={tourCount} />
        </Box>
    );
}

export default SceneDataGrid;
