/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * NonModelAssets
 *
 * This component renders the referenced non-model assets for Scene metadata ingestion component.
 * The list also provides links to allow individual ingestion/update of assets depending
 * on whether they exist in system or not.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { formatBytes } from '../../../../../utils/upload';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        [breakpoints.up('lg')]: {
            width: '60vw'
        },
        [breakpoints.only('md')]: {
            width: '54vw'
        },
        minWidth: '880px',
        maxWidth: '1100px',
        flexDirection: 'column',
        borderRadius: 5,
        padding: '10px 10px 0px 10px',
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

interface NonModelAsset {
    uri: string;
    type: string;
    description?: string | undefined;
    size?: number | undefined;
    idAssetVersion?: number | undefined;
}

interface NonModelAssetsProps {
    nonModelAssets: NonModelAsset[];
    idAssetVersion?: number | null;
}

interface NonModelAssetProps {
    nonModelAsset: NonModelAsset;
    idAssetVersion?: number | null;
}

function NonModelAssets(props: NonModelAssetsProps): React.ReactElement {
    const { nonModelAssets, idAssetVersion } = props;
    const classes = useStyles();
    const hasAssets = !!(nonModelAssets?.length ?? 0);

    return (
        <Box className={classes.container}>
            <Header />
            {!hasAssets && <Empty />}
            {hasAssets && (
                <Box className={classes.list}>
                    {nonModelAssets.map((nonModelAsset, index: number) => (
                        <Item key={index} nonModelAsset={nonModelAsset} idAssetVersion={idAssetVersion} />
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
            <Box display='flex' flex={2.5}>
                <Typography className={classes.header}>Referenced Non-Model Assets</Typography>
            </Box>
            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.header}>Type</Typography>
            </Box>
            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.header}>File Size</Typography>
            </Box>
            <Box display='flex' flex={3.0} justifyContent='center'>
                <Typography className={classes.header}>Description</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.header}>Action</Typography>
            </Box>
        </Box>
    );
}

function Item(props: NonModelAssetProps): React.ReactElement {
    const { nonModelAsset } = props;
    const { uri, type, description, size, idAssetVersion } = nonModelAsset;
    const classes = useStyles();

    const isAssetInUpload = idAssetVersion === -1;

    return (
        <Box display='flex' flex={1} flexDirection='row' px={1} marginBottom={1}>
            <Box display='flex' flex={2.5}>
                {isAssetInUpload && <Typography className={classes.label}>{uri}</Typography>}
                {!isAssetInUpload && <Typography className={clsx(classes.label, classes.labelItalics)}>{uri}</Typography>}
            </Box>

            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.label}>{type}</Typography>
            </Box>
            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.label}>{size ? formatBytes(size): ''}</Typography>
            </Box>
            <Box display='flex' flex={3.0}>
                <Typography className={classes.label}>{description}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                {isAssetInUpload && (<Typography className={clsx(classes.label, classes.labelItalics)}>(uploaded)</Typography>)}
                {!isAssetInUpload && (<Typography className={clsx(classes.label, classes.labelItalics)}>Missing</Typography>)}
            </Box>
        </Box>
    );
}

function Empty(): React.ReactElement {
    const classes = useStyles();

    return <Typography className={classes.empty}>No referenced non-model assets found</Typography>;
}

export default NonModelAssets;
