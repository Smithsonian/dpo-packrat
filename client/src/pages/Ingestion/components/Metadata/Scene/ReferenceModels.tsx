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
import { getDetailsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        [breakpoints.up('xl')]: {
            width: '70vw'
        },
        [breakpoints.only('lg')]: {
            width: '60vw'
        },
        [breakpoints.only('md')]: {
            width: '54vw'
        },
        [breakpoints.down('sm')]: {
            width: '45vw'
        },
        flexDirection: 'column',
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light,
        marginBottom: 10
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

interface ReferenceModel {
    BoundingBoxP1X: number;
    BoundingBoxP1Y: number;
    BoundingBoxP1Z: number;
    BoundingBoxP2X: number;
    BoundingBoxP2Y: number;
    BoundingBoxP2Z: number;
    FileSize: string;
    Model: any;
    Name: string;
    Quality: string;
    UVResolution: number;
    Usage: string;
    idModel: number;
    idModelSceneXref: number;
    idScene: number;
}

interface ReferenceModelsProps {
    referenceModels: ReferenceModel[];
}

const roundBoundingBox = (BB: number) => {
    if (BB < 1) return Number(BB.toPrecision(3));
    return BB.toFixed(2);
};

function ReferenceModels(props: ReferenceModelsProps): React.ReactElement {
    const { referenceModels } = props;
    const classes = useStyles();
    const hasModels = !!referenceModels.length;

    return (
        <Box className={classes.container}>
            <Header />
            {!hasModels && <Empty />}
            {hasModels && (
                <Box className={classes.list}>
                    {referenceModels.map((referenceModel, index: number) => (
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
    const { Model, Name, FileSize, UVResolution, Quality, Usage } = referenceModel;
    const { BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = referenceModel;
    const classes = useStyles();

    // const onAction = () => {
    //     alert(`TODO: KARAN: Handle ${action.toString()} action`);
    // };

    const boundingBox: string = `(${roundBoundingBox(BoundingBoxP1X)}, ${roundBoundingBox(BoundingBoxP1Y)}, ${roundBoundingBox(BoundingBoxP1Z)}) - (${roundBoundingBox(
        BoundingBoxP2X
    )}, ${roundBoundingBox(BoundingBoxP2Y)}, ${roundBoundingBox(BoundingBoxP2Z)})`;
    return (
        <Box display='flex' flex={1} flexDirection='row' px={1} marginBottom={1}>
            <Box display='flex' flex={2.5}>
                {Model ? (
                    <NewTabLink to={getDetailsUrlForObject(Model?.SystemObject?.idSystemObject)}>
                        <Typography className={clsx(classes.label, classes.labelUnderline)}>{Name}</Typography>
                    </NewTabLink>
                ) : (
                    <Typography className={clsx(classes.label, classes.labelItalics)}>{Name}</Typography>
                )}
            </Box>

            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{Usage}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{Quality}</Typography>
            </Box>

            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{formatBytes(FileSize)}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.label}>{UVResolution}</Typography>
            </Box>
            <Box display='flex' flex={2} justifyContent='center'>
                <Typography className={classes.label}>{boundingBox}</Typography>
            </Box>
            <Box display='flex' flex={0.5} justifyContent='center'>
                <Typography onClick={() => {}} className={clsx(classes.label, classes.labelUnderline)}>
                    {Model ? 'Update' : 'Ingest'}
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
