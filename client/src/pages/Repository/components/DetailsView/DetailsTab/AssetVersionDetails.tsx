/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */
/**
 * AssetVersionDetails
 *
 * This component renders details tab for AssetVersion specific details used in DetailsTab component.
 */
import { Box, makeStyles, Typography, Button, Table, TableBody, TableCell, TableContainer, TableRow, Checkbox } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { DetailComponentProps } from './index';
import { sharedButtonProps } from '../../../../../utils/shared';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import { eSystemObjectType } from '@dpo-packrat/common';
import { apolloClient } from '../../../../../graphql';
import { GetAssetDocument } from '../../../../../types/graphql';
import { useDetailTabStore } from '../../../../../store';
import { DebounceInput } from 'react-debounce-input';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';

export const useAVDetailsStyles = makeStyles(() => ({
    value: {
        fontSize: '0.8em',
        color: 'black',
    },
    button: {
        ...sharedButtonProps,
        outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
    }
}));

function AssetVersionDetails(props: DetailComponentProps): React.ReactElement {
    const AVclasses = useAVDetailsStyles();
    const tableClasses = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;
    const history = useHistory();
    const [AssetVersionDetails, updateDetailField] = useDetailTabStore(state => [state.AssetVersionDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, AssetVersionDetails);
    }, [AssetVersionDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eAssetVersion, name, value);
    };

    const assetVersionData = data.getDetailsTabDataForObject?.AssetVersion;
    let redirect = () => {};
    if (assetVersionData) {
        // redirect function fetches assetType so that uploads remembers the assetType for uploads
        redirect = async () => {
            const {
                data: {
                    getAsset: {
                        Asset: { idVAssetType }
                    }
                }
            } = await apolloClient.query({
                query: GetAssetDocument,
                variables: { input: { idAsset: assetVersionData.idAsset } }
            });
            const newEndpoint = updateSystemObjectUploadRedirect(assetVersionData.idAsset, assetVersionData.idAssetVersion, eSystemObjectType.eAssetVersion, idVAssetType);
            history.push(newEndpoint);
        };
    }

    return (
        <Box>
            <TableContainer className={tableClasses.captureMethodTableContainer}>
                <Table className={tableClasses.table}>
                    <TableBody>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Version</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <span className={tableClasses.valueText} style={{ paddingLeft: 10 }}>
                                    {AssetVersionDetails.Version}
                                </span>
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>File Path</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='FilePath'
                                    value={assetVersionData?.FilePath || ''}
                                    className={tableClasses.input}
                                    name='FilePath'
                                    onChange={onSetField}
                                    debounceTimeout={400}
                                    style={{ width: '300px', height: 18, ...updatedFieldStyling(isFieldUpdated(AssetVersionDetails, assetVersionData, 'FilePath'))}}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Creator</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <span className={tableClasses.valueText} style={{ paddingLeft: 10 }}>
                                    {AssetVersionDetails.Creator}
                                </span>
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Date Created</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <span className={tableClasses.valueText} style={{ paddingLeft: 10 }}>
                                    {AssetVersionDetails.DateCreated}
                                </span>
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Storage Hash</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <span className={tableClasses.valueText} style={{ height: 'fit-content', minHeight: 20, paddingLeft: 10, display: 'flex', alignItems: 'center' }}>
                                    {AssetVersionDetails.StorageHash}
                                </span>
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Storage Size</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <span className={tableClasses.valueText} style={{ paddingLeft: 10 }}>
                                    {formatBytes(AssetVersionDetails.StorageSize ?? 0)}
                                </span>
                            </TableCell>
                        </TableRow>
                        <TableRow className={tableClasses.tableRow}>
                            <TableCell className={tableClasses.tableCell}>
                                <Typography className={tableClasses.labelText}>Ingested</Typography>
                            </TableCell>
                            <TableCell className={tableClasses.tableCell}>
                                <Checkbox className={tableClasses.checkbox} disabled name='Ingested' title='Ingested-Checkbox' checked={AssetVersionDetails?.Ingested ?? false} size='small' style={{ paddingLeft: 10 }} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Button className={AVclasses.button} variant='contained' disableElevation color='primary' style={{ width: 'fit-content', marginTop: '7px' }} onClick={redirect}>
                Add Version
            </Button>
        </Box>
    );
}

export default AssetVersionDetails;
