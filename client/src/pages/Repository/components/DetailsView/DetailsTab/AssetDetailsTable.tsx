/* eslint-disable react/jsx-max-props-per-line */

/**
 * AssetDetailsTable
 *
 * This component renders asset details table tab for the DetailsTab component.
 */
import { Box, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable, NewTabLink } from '../../../../../components';
import { StateAssetDetail, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '../../../../../types/server';
import { getDetailsUrlForObject, getDownloadAllAssetsUrlForObject, getDownloadAssetVersionUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { useObjectAssets } from '../../../hooks/useDetailsView';
import GetAppIcon from '@material-ui/icons/GetApp';
import { sharedButtonProps, formatDate } from '../../../../../utils/shared';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import { useHistory } from 'react-router-dom';

export const useStyles = makeStyles(({ palette }) => ({
    container: {
        width: '100%',
        background: palette.secondary.light,
        padding: 5,
        borderRadius: 5,
        marginBottom: 7
    },
    header: {
        fontSize: '0.9em',
        color: palette.primary.dark,
        fontWeight: 'bold'
    },
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    empty: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        background: palette.secondary.light,
        padding: 40,
        borderRadius: 5
    },
    link: {
        textDecoration: 'underline'
    },
    btn: sharedButtonProps
}));

interface AssetDetailsTableProps {
    idSystemObject: number;
    systemObjectType?: eSystemObjectType;
}

function AssetDetailsTable(props: AssetDetailsTableProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject, systemObjectType } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const { data, loading } = useObjectAssets(idSystemObject);
    const getVocabularyTerm = useVocabularyStore(state => state.getVocabularyTerm);
    const history = useHistory();

    const headers: string[] = ['Link', 'Name', 'Path', 'Asset Type', 'Version', 'Date Created', 'Size'];

    if (!data || loading) {
        return <EmptyTable />;
    }

    const { assetDetails } = data.getAssetDetailsForSystemObject;
    let redirect = () => {};
    if (data.getAssetDetailsForSystemObject?.assetDetails?.[0]) {
        const { idAsset, idAssetVersion, assetType } = data.getAssetDetailsForSystemObject?.assetDetails?.[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    return (
        <React.Fragment>
            <table className={classes.container}>
                <thead>
                    <tr>
                        {headers.map((header, index: number) => (
                            <th key={index} align='center'>
                                <Typography className={classes.header}>{header}</Typography>
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <td colSpan={headers.length}>
                            <hr />
                        </td>
                    </tr>
                </thead>

                <tbody>
                    {assetDetails.map((assetDetail: StateAssetDetail, index: number) => (
                        <tr key={index}>
                            <td>
                                <a
                                    href={getDownloadAssetVersionUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, assetDetail.idAssetVersion)}
                                    style={{ textDecoration: 'none', color: 'black' }}
                                >
                                    <GetAppIcon />
                                </a>
                            </td>
                            <td>
                                <NewTabLink to={getDetailsUrlForObject(assetDetail.idSystemObject)}>
                                    <Typography className={clsx(classes.value, classes.link)}>{assetDetail.name}</Typography>
                                </NewTabLink>
                            </td>
                            <td>
                                <Typography className={classes.value}>{assetDetail.path}</Typography>
                            </td>
                            <td align='center'>
                                <Typography className={classes.value}>{getVocabularyTerm(eVocabularySetID.eAssetAssetType, assetDetail.assetType)}</Typography>
                            </td>
                            <td align='center'>
                                <Typography className={classes.value}>{assetDetail.version}</Typography>
                            </td>
                            <td align='center'>
                                <Typography className={classes.value}>{formatDate(assetDetail.dateCreated)}</Typography>
                            </td>
                            <td align='center'>
                                <Typography className={classes.value}>{formatBytes(assetDetail.size)}</Typography>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={headers.length}>
                            {!assetDetails.length && (
                                <Box my={2}>
                                    <Typography align='center' className={classes.value}>
                                        No assets found
                                    </Typography>
                                </Box>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
            <Box display='flex' flexDirection='row' alignItems='center'>
                {assetDetails.length > 0 && (
                    <a href={getDownloadAllAssetsUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, idSystemObject)} style={{ textDecoration: 'none' }}>
                        <Button disableElevation color='primary' variant='contained' className={classes.btn} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                            Download All
                        </Button>
                    </a>
                )}
                <Button className={classes.btn} variant='contained' color='primary' style={{ width: 'fit-content', marginLeft: '2px' }} onClick={redirect}>
                    Add Version
                </Button>
            </Box>
        </React.Fragment>
    );
}

export default AssetDetailsTable;
