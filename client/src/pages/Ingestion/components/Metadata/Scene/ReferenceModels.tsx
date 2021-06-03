/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ReferenceModels
 *
 * This component renders the reference model list for Scene metadata ingestion component.
 * The list also provides links to allow individual ingestion/update of models depending
 * on whether they exist in system or not.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { NewTabLink } from '../../../../../components';
import { getDetailsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { updateSystemObjectUploadRedirect, ingestSystemObjectUploadRedirect } from '../../../../../constants';
import { eSystemObjectType } from '../../../../../types/server';
import { apolloClient } from '../../../../../graphql';
import { GetModelDocument, GetAssetDetailsForSystemObjectDocument } from '../../../../../types/graphql';

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
    FileSize: number;
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
    idAssetVersion?: number | null;
}

interface ReferenceModelItemProps {
    referenceModel: ReferenceModel;
    idAssetVersion?: number | null;
}

const roundBoundingBox = (BB: number) => {
    if (BB == null) return '';
    return BB < 1 ? Number(BB.toPrecision(3)) : BB.toFixed(2);
};

function ReferenceModels(props: ReferenceModelsProps): React.ReactElement {
    const { referenceModels, idAssetVersion } = props;
    const classes = useStyles();
    const hasModels = !!(referenceModels?.length ?? 0);

    return (
        <Box className={classes.container}>
            <Header />
            {!hasModels && <Empty />}
            {hasModels && (
                <Box className={classes.list}>
                    {referenceModels.map((referenceModel, index: number) => (
                        <Item key={index} referenceModel={referenceModel} idAssetVersion={idAssetVersion} />
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
            <Box display='flex' flex={3.5}>
                <Typography className={classes.header}>Reference Models(s)</Typography>
            </Box>
            <Box display='flex' flex={0.75}>
                <Typography className={classes.header}>Usage</Typography>
            </Box>
            <Box display='flex' flex={0.75}>
                <Typography className={classes.header}>Quality</Typography>
            </Box>
            <Box display='flex' flex={0.75}>
                <Typography className={classes.header}>File Size</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='center'>
                <Typography className={classes.header}>UV Resolution</Typography>
            </Box>
            <Box display='flex' flex={2.5} justifyContent='center'>
                <Typography className={classes.header}>Bounding Box</Typography>
            </Box>
            <Box display='flex' flex={0.5}>
                <Typography className={classes.header}>Action</Typography>
            </Box>
        </Box>
    );
}

function Item(props: ReferenceModelItemProps): React.ReactElement {
    const { referenceModel, idAssetVersion } = props;
    const { Name, FileSize, UVResolution, Quality, Usage, idModel } = referenceModel;
    const { BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = referenceModel;
    const [idAsset, setIdAsset] = useState<null | number>(null);
    const [idSystemObject, setIdSystemObject] = useState<null | number>(null);
    const [assetType, setAssetType] = useState<null | number>(null);
    const classes = useStyles();

    useEffect(() => {
        const getModelDetails = async () => {
            const { data } = await apolloClient.query({
                query: GetModelDocument,
                variables: {
                    input: {
                        idModel
                    }
                }
            });
            setIdSystemObject(data?.getModel.Model?.SystemObject?.idSystemObject);
            if (idSystemObject) {
                const assetDetail = await apolloClient.query({
                    query: GetAssetDetailsForSystemObjectDocument,
                    variables: {
                        input: {
                            idSystemObject
                        }
                    }
                });
                setIdAsset(assetDetail?.data?.getAssetDetailsForSystemObject?.assetDetails?.[0]?.idAsset);
                setAssetType(assetDetail?.data?.getAssetDetailsForSystemObject?.assetDetails?.[0]?.assetType);
            }
        };

        getModelDetails();
    }, [idAsset, idAssetVersion, idModel, idSystemObject]);

    const isModelInSystem = idModel > 0;

    let boundingBox: string = '';
    if (BoundingBoxP1X != null && BoundingBoxP1Y != null && BoundingBoxP1Z != null && BoundingBoxP2X != null && BoundingBoxP2Y != null && BoundingBoxP2Z != null)
        boundingBox = `(${roundBoundingBox(BoundingBoxP1X)}, ${roundBoundingBox(BoundingBoxP1Y)}, ${roundBoundingBox(BoundingBoxP1Z)}) - (${roundBoundingBox(
            BoundingBoxP2X
        )}, ${roundBoundingBox(BoundingBoxP2Y)}, ${roundBoundingBox(BoundingBoxP2Z)})`;

    return (
        <Box display='flex' flex={1} flexDirection='row' px={1} marginBottom={1}>
            <Box display='flex' flex={3}>
                {isModelInSystem && idSystemObject && (
                    <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>
                        <Typography className={clsx(classes.label, classes.labelUnderline)}>{Name}</Typography>
                    </NewTabLink>
                )}
                {!isModelInSystem && <Typography className={clsx(classes.label, classes.labelItalics)}>{Name}</Typography>}
            </Box>

            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.label}>{Usage}</Typography>
            </Box>
            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.label}>{Quality}</Typography>
            </Box>

            <Box display='flex' flex={0.75} justifyContent='center'>
                <Typography className={classes.label}>{formatBytes(FileSize)}</Typography>
            </Box>
            <Box display='flex' flex={0.5} justifyContent='center'>
                <Typography className={classes.label}>{UVResolution}</Typography>
            </Box>
            <Box display='flex' flex={2.5} justifyContent='center'>
                <Typography className={classes.label}>{boundingBox}</Typography>
            </Box>
            <Box display='flex' flex={0.5} justifyContent='center'>
                {!isModelInSystem && (
                    <Typography className={clsx(classes.label, classes.labelUnderline)}>
                        <NewTabLink to={ingestSystemObjectUploadRedirect(Name)}>Ingest</NewTabLink>
                    </Typography>
                )}
                {isModelInSystem && (
                    <Typography className={clsx(classes.label, classes.labelUnderline)}>
                        <NewTabLink to={updateSystemObjectUploadRedirect(idAsset, idAssetVersion, eSystemObjectType.eModel, assetType)}>Update</NewTabLink>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

function Empty(): React.ReactElement {
    const classes = useStyles();

    return <Typography className={classes.empty}>No reference model(s) found</Typography>;
}

export default ReferenceModels;
