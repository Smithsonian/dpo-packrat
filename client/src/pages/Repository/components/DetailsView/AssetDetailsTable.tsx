/**
 * AssetTable
 *
 * This component renders asset table tab for the DetailsTab component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { StateAssetDetail, useVocabularyStore } from '../../../../store';
import { eVocabularySetID } from '../../../../types/server';
import { formatBytes } from '../../../../utils/upload';

const useStyles = makeStyles(({ palette }) => ({
    table: {
        width: '100%',
        background: palette.secondary.light,
        padding: 5,
        borderRadius: 5
    },
    header: {
        fontSize: '0.9em',
        color: palette.primary.dark
    },
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
}));

interface AssetDetailsTableProps {
    assetDetails: StateAssetDetail[];
}

function AssetDetailsTable(props: AssetDetailsTableProps): React.ReactElement {
    const classes = useStyles();
    const { assetDetails } = props;
    const getVocabularyTerm = useVocabularyStore(state => state.getVocabularyTerm);

    const headers: string[] = [
        'Name',
        'Path',
        'Asset Type',
        'Version',
        'Date Created',
        'Size',
    ];

    return (
        <table className={classes.table}>
            <tr>
                {headers.map((header, index: number) => (
                    <th key={index} align='left'>
                        <Typography className={classes.header}>{header}</Typography>
                    </th>
                ))}
            </tr>
            {assetDetails.map((assetDetail: StateAssetDetail, index: number) => (
                <tr key={index}>
                    <td>
                        <Typography className={classes.value}>{assetDetail.name}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{assetDetail.path}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{getVocabularyTerm(eVocabularySetID.eAssetAssetType, assetDetail.assetType)}</Typography>
                    </td>
                    <td align='left'>
                        <Typography className={classes.value}>{assetDetail.version}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{assetDetail.dateCreated}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{formatBytes(assetDetail.size)}</Typography>
                    </td>
                </tr>
            ))}
            <td colSpan={6}>
                {!assetDetails.length && (
                    <Box my={2}>
                        <Typography align='center' className={classes.value}>No assets found</Typography>
                    </Box>
                )}
            </td>
        </table>
    );
}

export default AssetDetailsTable;