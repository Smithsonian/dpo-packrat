/* eslint-disable react-hooks/exhaustive-deps */
/**
 * AssetVersionDetails
 *
 * This component renders details tab for AssetVersion specific details used in DetailsTab component.
 */
import { Box, makeStyles, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, FieldType, Loader } from '../../../../../components';
import { AssetVersionDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { DetailComponentProps } from './index';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    }
}));

function AssetVersionDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType, disabled } = props;

    const [details, setDetails] = useState<AssetVersionDetailFields>({});

    useEffect(() => {
        if (data && !loading) {
            const { AssetVersion } = data.getDetailsTabDataForObject;
            setDetails({
                Version: AssetVersion?.Version,
                Creator: AssetVersion?.Creator,
                DateCreated: AssetVersion?.DateCreated,
                StorageSize: AssetVersion?.StorageSize,
                Ingested: AssetVersion?.Ingested,
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

    return (
        <Box>
            <FieldType
                required
                label='Version'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
                <Typography className={classes.value}>{details.Version}</Typography>
            </FieldType>
            <FieldType
                required
                label='Creator'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
                <Typography className={classes.value}>{details.Creator}</Typography>
            </FieldType>
            <FieldType
                required
                label='Date Created'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
                <Typography className={classes.value}>{details.DateCreated}</Typography>
            </FieldType>
            <FieldType
                required
                label='StorageSize'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
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
        </Box>
    );
}

export default AssetVersionDetails;