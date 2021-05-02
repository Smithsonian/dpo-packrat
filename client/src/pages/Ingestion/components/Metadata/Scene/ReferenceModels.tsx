/**
 * ReferenceModels
 *
 * This component renders the reference model list for Scene metadata ingestion component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { NewTabLink } from '../../../../../components';
import { ReferenceModelAction /*, StateReferenceModel*/ } from '../../../../../store';
import { getDetailsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        width: '52vw',
        flexDirection: 'column',
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light
    },
    list: {
        padding: 10,
        paddingBottom: 0,
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: palette.secondary.light
    },
    header: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    labelUnderline: {
        textDecoration: 'underline',
        cursor: 'pointer'
    },
    labelItalics: {
        fontStyle: 'italic'
    },
    empty: {
        textAlign: 'center',
        margin: '15px 0px',
        fontSize: '0.8em',
        color: palette.primary.dark
    }
}));

const mockReferenceModels = [
    {
        idSystemObject: 1,
        name: 'Armstrong1.obj (mock)',
        usage: 'Web3D',
        quality: 'Thumb',
        fileSize: 1.27e7,
        resolution: 2000,
        boundingBoxP1X: 1.0,
        boundingBoxP1Y: 1.0,
        boundingBoxP1Z: 1.0,
        boundingBoxP2X: 10.0,
        boundingBoxP2Y: 10.0,
        boundingBoxP2Z: 10.0,
        action: ReferenceModelAction.Update,
        existingModel: true
    },
    {
        idSystemObject: 1,
        name: 'Armstrong2.obj (mock)',
        usage: 'Web3D',
        quality: 'High',
        fileSize: 1.27e7,
        resolution: 2000,
        boundingBoxP1X: 1.0,
        boundingBoxP1Y: 1.0,
        boundingBoxP1Z: 1.0,
        boundingBoxP2X: 10.0,
        boundingBoxP2Y: 10.0,
        boundingBoxP2Z: 10.0,
        action: ReferenceModelAction.Update,
        existingModel: false
    }
];

function ReferenceModels(): React.ReactElement {
    const classes = useStyles();
    const hasModels = !!mockReferenceModels.length;

    return (
        <Box className={classes.container}>
            <Header />
            {!hasModels && <Empty />}
            {hasModels && (
                <Box className={classes.list}>
                    {mockReferenceModels.map((referenceModel, index: number) => (
                        <Item key={index} referenceModel={referenceModel} />
                    ))}
                </Box>
            )}
        </Box>
    );
}

function Header(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box display='flex' flex={1} flexDirection='row' px={1} marginBottom={1}>
            <Box display='flex' flex={3}>
                <Typography className={classes.header}>Reference Models(s)</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>Usage</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>Quality</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>File Size</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.header}>UV Resolution</Typography>
            </Box>
            <Box display='flex' flex={2} justifyContent='center'>
                <Typography className={classes.header}>Bounding Box</Typography>
            </Box>
            <Box display='flex' flex={0.5}>
                <Typography className={classes.header}>Action</Typography>
            </Box>
        </Box>
    );
}

function Item({ referenceModel }): React.ReactElement {
    const { idSystemObject, name, fileSize, resolution, action, quality, usage, existingModel } = referenceModel;
    const { boundingBoxP1X, boundingBoxP1Y, boundingBoxP1Z, boundingBoxP2X, boundingBoxP2Y, boundingBoxP2Z } = referenceModel;
    const classes = useStyles();

    const onAction = () => {
        alert(`TODO: KARAN: Handle ${action.toString()} action`);
    };

    const boundingBox: string = `(${boundingBoxP1X}, ${boundingBoxP1Y}, ${boundingBoxP1Z}) - (${boundingBoxP2X}, ${boundingBoxP2Y}, ${boundingBoxP2Z})`;
    return (
        <Box display='flex' flex={1} flexDirection='row' px={1} marginBottom={1}>
            <Box display='flex' flex={2.5}>
                {existingModel ? (
                    <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>
                        <Typography className={clsx(classes.label, classes.labelUnderline)}>{name}</Typography>
                    </NewTabLink>
                ) : (
                    <Typography className={clsx(classes.label, classes.labelUnderline, classes.labelItalics)}>{name}</Typography>
                )}
            </Box>

            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{usage}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{quality}</Typography>
            </Box>

            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{formatBytes(fileSize)}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{resolution}</Typography>
            </Box>
            <Box display='flex' flex={2} justifyContent='center'>
                <Typography className={classes.label}>{boundingBox}</Typography>
            </Box>
            <Box display='flex' flex={0.5} justifyContent='center'>
                <Typography onClick={onAction} className={clsx(classes.label, classes.labelUnderline)}>
                    {action.toString()}
                </Typography>
            </Box>
        </Box>
    );
}

function Empty(): React.ReactElement {
    const classes = useStyles();

    return <Typography className={classes.empty}>No reference model(s) found</Typography>;
}

export default ReferenceModels;
