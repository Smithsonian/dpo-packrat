/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-max-props-per-line */
/**
 * AssetVersionDetails
 *
 * This component renders details tab for AssetVersion specific details used in DetailsTab component.
 */
import { Box, makeStyles, Typography, Button } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CheckboxField, FieldType, Loader } from '../../../../../components';
import { AssetVersionDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { DetailComponentProps } from './index';
import { sharedButtonProps } from '../../../../../utils/shared';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import { eSystemObjectType } from '../../../../../types/server';
import { apolloClient } from '../../../../../graphql';
import { GetAssetDocument } from '../../../../../types/graphql';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    button: sharedButtonProps
}));

function AssetVersionDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;
    let { disabled } = props;
    const history = useHistory();
    const [details, setDetails] = useState<AssetVersionDetailFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { AssetVersion } = data.getDetailsTabDataForObject;
            setDetails({
                Version: AssetVersion?.Version,
                Creator: AssetVersion?.Creator,
                DateCreated: AssetVersion?.DateCreated,
                StorageSize: AssetVersion?.StorageSize,
                Ingested: AssetVersion?.Ingested
            });
        }
    }, [data, loading]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        setDetails(details => ({ ...details, [name]: checked }));
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

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
            console.log('idasset', assetVersionData.idAsset, 'idVAssetType', idVAssetType);
            const newEndpoint = updateSystemObjectUploadRedirect(assetVersionData.idAsset, assetVersionData.idAssetVersion, eSystemObjectType.eAssetVersion, idVAssetType);
            history.push(newEndpoint);
        };
    }

    disabled = true;
    return (
        <Box>
            <FieldType required label='Version' direction='row' containerProps={rowFieldProps} width='auto'>
                <Typography className={classes.value}>{details.Version}</Typography>
            </FieldType>
            <FieldType required label='Creator' direction='row' containerProps={rowFieldProps} width='auto'>
                <Typography className={classes.value}>{details.Creator}</Typography>
            </FieldType>
            <FieldType required label='Date Created' direction='row' containerProps={rowFieldProps} width='auto'>
                <Typography className={classes.value}>{details.DateCreated}</Typography>
            </FieldType>
            <FieldType required label='StorageSize' direction='row' containerProps={rowFieldProps} width='auto'>
                <Typography className={classes.value}>{formatBytes(details.StorageSize ?? 0)}</Typography>
            </FieldType>

            <CheckboxField
                viewMode
                required
                updated={isFieldUpdated(details, assetVersionData, 'Ingested')}
                disabled={disabled}
                name='Ingested'
                label='Ingested'
                value={details.Ingested ?? false}
                onChange={setCheckboxField}
            />

            <Button className={classes.button} variant='contained' color='primary' style={{ width: 'fit-content', marginTop: '7px' }} onClick={redirect}>
                Add Version
            </Button>
        </Box>
    );
}

export default AssetVersionDetails;
