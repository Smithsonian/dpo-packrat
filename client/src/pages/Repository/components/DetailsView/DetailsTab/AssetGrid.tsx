/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * AssetGrid
 *
 * This component renders asset grid tab for the DetailsTab component.
 */

import { Box, Button /*, Typography */ } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// // import clsx from 'clsx';
import { NewTabLink, EmptyTable } from '../../../../../components';
import { eSystemObjectType, eIcon } from '../../../../../types/server';
import { useObjectAssets } from '../../../hooks/useDetailsView';
import { getDownloadAllAssetsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { sharedButtonProps, formatDate } from '../../../../../utils/shared';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import { useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import MUIDataTable, { MUIDataTableOptions, MUIDataTableColumn } from 'mui-datatables';
import GetAppIcon from '@material-ui/icons/GetApp';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

export const useStyles = makeStyles(({ palette }) => ({
    container: {
        width: '100%',
        background: palette.secondary.light,
        padding: 5,
        borderRadius: 5,
        marginBottom: 7
    },
    dataGrid: {
        '& > *': {
            minHeight: 'fit-content',
            // wordBreak: 'break-all',
            overflowWrap: 'break-word'
        }
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

interface AssetGridProps {
    idSystemObject: number;
    systemObjectType?: eSystemObjectType;
}

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    backgroundColor: 'pink',
                    height: 'fit-content',
                    padding: '2px'
                    // '& > *': {
                    //     display: 'flex'
                    // }
                }
            },
            MuiTableRow: {
                root: {
                    alignSelf: 'center'
                }
            }
        }
    });

function AssetGrid(props: AssetGridProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject, systemObjectType } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const { data } = useObjectAssets(idSystemObject);
    const history = useHistory();
    const [assetColumns, setAssetColumns] = useState<any>([]);
    // const [assetRows, setAssetRows] = useState<any[]>([]);
    /*
        TODO
        type the column object, data row, appropriately
        write row creation handler
        write row hiding handler
        style row height and color
        customize the rest of the datagrid to exclude the unnecessary features
    */

    const formatToDataTableColumns = (fields: any[]): MUIDataTableColumn[] => {
        const result: MUIDataTableColumn[] = [];
        fields.forEach(async ({ colName, colType, colDisplay, colLabel }) => {
            const gridColumnObject: MUIDataTableColumn = {
                name: colName,
                label: colLabel,
                options: {
                    display: !colDisplay
                }
            };

            switch (colType) {
                // TODO refactor to enum
                case 'boolean':
                case 'string':
                case 'number':
                    break;
                case 'date':
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatDate(value);
                        }
                    };
                    break;
                case 'fileSize':
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatBytes(value as number);
                        }
                    };
                    break;
                case 'hyperlink':
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            console.log('value', value);
                            if (value.label) {
                                return (
                                    <NewTabLink to={value.path} style={{ textDecoration: 'underline' }}>
                                        {value.label}
                                    </NewTabLink>
                                );
                            }

                            if (value.icon !== null) {
                                return (
                                    <NewTabLink to={value.path} style={{ display: 'flex' }}>
                                        {renderIcon(value.icon)}
                                    </NewTabLink>
                                );
                            }

                            return (
                                <NewTabLink to={value.path} style={{ textDecoration: 'underline' }}>
                                    {value.path}
                                </NewTabLink>
                            );
                        }
                    };
            }

            result.push(gridColumnObject);
        });
        return result;
    };

    //     // const formatToDataGridRows = () => {
    //     //     // Replace this with actual GQL data fetching and/or formatting
    //     //     // Will need to inject an id per row
    //     //     return [
    //     //         {
    //     //             id: 1,
    //     //             Link: { label: null, path: '/admin', icon: eIcon.eIconDownload },
    //     //             Name: { label: 'helmet.jpeg', path: '/repository/details/1232', icon: null },
    //     //             AssetType: 'Photogrammetry',
    //     //             Version: 1,
    //     //             DateCreated: '7/2/2021',
    //     //             Size: 2348799003
    //     //         },
    //     //         {
    //     //             id: 2,
    //     //             Link: { label: null, path: '/repository', icon: eIcon.eIconDownload },
    //     //             Name: { label: 'nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb', path: '/repository/details/1232', icon: null },
    //     //             AssetType: 'Photogrammetry',
    //     //             Version: 88,
    //     //             DateCreated: '7/2/2021',
    //     //             Size: 799003
    //     //         },
    //     //         {
    //     //             id: 3,
    //     //             Link: { label: null, path: '/dashboard', icon: eIcon.eIconDownload },
    //     //             Name: { label: 'nmah-1981_0706_06-clemente_helmet-100k-2048-high.glb.jpeg', path: '/repository/details/1232', icon: null },
    //     //             AssetType: 'Photogrammetry',
    //     //             Version: 2,
    //     //             DateCreated: '7/2/2021',
    //     //             Size: 2348
    //     //         }
    //     //     ];
    //     // };

    const renderIcon = (type: eIcon) => {
        if (type === eIcon.eIconDownload) {
            return <GetAppIcon />;
        }
        return;
    };

    useEffect(() => {
        const initializeColumnsAndRows = async () => {
            const sampleColumns = [
                // { colName: 'Link', colType: 'hyperlink', colDisplay: true, colLabel: 'Link' },
                // {
                //     colName: 'Name',
                //     colType: 'hyperlink',
                //     colDisplay: true,
                //     colLabel: 'Name'
                // },
                // {
                //     colName: 'AssetType',
                //     colType: 'string',
                //     colDisplay: true,
                //     colLabel: 'Asset Type'
                // },
                // {
                //     colName: 'Version',
                //     colType: 'number',
                //     colDisplay: true,
                //     colLabel: 'Version'
                // },
                // {
                //     colName: 'DateCreated',
                //     colType: 'date',
                //     colDisplay: true,
                //     colLabel: 'Date Created'
                // },
                // {
                //     colName: 'Size',
                //     colType: 'fileSize',
                //     colDisplay: true,
                //     colLabel: 'Size'
                // }
                { colName: 'Name', colLabel: 'Name', coDisplay: true, colType: 'string' },
                { colName: 'Title', colLabel: 'Title', coDisplay: true, colType: 'hyperlink' },
                { colName: 'Location', colLabel: 'Location', coDisplay: true, colType: 'string' },
                { colName: 'Age', colLabel: 'Age', coDisplay: true, colType: 'number' },
                { colName: 'Salary', colLabel: 'Salary', coDisplay: true, colType: 'fileSize' }
            ];

            await setAssetColumns(formatToDataTableColumns(sampleColumns));
            // await setAssetRows(formatToDataGridRows());
        };

        initializeColumnsAndRows();
    }, []);

    if (!assetColumns || !data) {
        return <EmptyTable />;
    }

    //     // const toggleColumn = async params => {
    //     //     const assetColumnsCopy = [...assetColumns];
    //     //     const column = assetColumnsCopy.find(col => col.field === params.field);
    //     //     if (column) {
    //     //         column.hide = !column.hide;
    //     //         setAssetColumns(assetColumnsCopy);
    //     //     }
    //     // };

    const { assetDetails } = data.getAssetDetailsForSystemObject;

    let redirect = () => {};
    if (data.getAssetDetailsForSystemObject?.assetDetails?.[0]) {
        const { idAsset, idAssetVersion, assetType } = data.getAssetDetailsForSystemObject?.assetDetails?.[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    const rows = [
        // [<GetAppIcon />, 'Business Analyst', 'Minneapolis', 30, 100000],
        // [null, 'Business Consultant', 'Dallas', 55, 200000],
        // [null, 'Attorney', 'Santa Ana', 27, 500000],
        ['Franky Rees', { label: null, path: '/admin', icon: eIcon.eIconDownload }, 'St. Petersburg', 22, 50000],
        ['Aaren Rose', { label: null, path: '/admin', icon: eIcon.eIconDownload }, 'Toledo', 28, 75000],
        // ['Blake Duncan', 'Business Management Analyst Business Management Analyst', 'San Diego', 65, 94000],
        // ['Frankie Parry', 'Agency Legal Counsel', 'Jacksonville', 71, 210000],
        // ['Lane Wilson', 'Commercial Specialist', 'Omaha', 19, 65000],
        // ['Robin Duncan', 'Business Analyst', 'Los Angeles', 20, 77000],
        ['Mel Brooks', { label: null, path: '/admin', icon: eIcon.eIconDownload }, 'Oklahoma City', 37, 135000],
        // ['Harper White', 'Attorney', 'Pittsburgh', 52, 420000],
        // ['Kris Humphrey', 'Agency Legal Counsel', 'Laredo', 30, 150000],
        // ['Frankie Long', 'Industrial Analyst', 'Austin', 31, 170000],
        // ['Brynn Robbins', 'Business Analyst', 'Norfolk', 22, 90000],
        ['Justice Mann', { label: null, path: '/admin', icon: eIcon.eIconDownload }, 'Chicago', 24, 133000]
        // ['Addison Navarro', 'Business Management Analyst', 'New York', 50, 295000],
        // ['Jesse Welch', 'Agency Legal Counsel', 'Seattle', 28, 200000],
        // ['Eli Mejia', 'Commercial Specialist', 'Long Beach', 65, 400000],
        // ['Gene Leblanc', 'Industrial Analyst', 'Hartford', 34, 110000],
        // ['Danny Leon', 'Computer Scientist', 'Newark', 60, 220000],
        // ['Lane Lee', 'Corporate Counselor', 'Cincinnati', 52, 180000],
        // ['Jesse Hall', 'Business Analyst', 'Baltimore', 44, 99000],
        // ['Danni Hudson', 'Agency Legal Counsel', 'Tampa', 37, 90000],
        // ['Terry Macdonald', 'Commercial Specialist', 'Miami', 39, 140000],
        // ['Justice Mccarthy', 'Attorney', 'Tucson', 26, 330000],
        // ['Silver Carey', 'Computer Scientist', 'Memphis', 47, 250000],
        // ['Franky Miles', 'Industrial Analyst', 'Buffalo', 49, 190000],
        // ['Glen Nixon', 'Corporate Counselor', 'Arlington', 44, 80000],
        // ['Gabby Strickland', 'Business Process Consultant', 'Scottsdale', null],
        // ['Mason Ray', 'Computer Scientist', 'San Francisco', 39, 142000]
    ];

    const options: MUIDataTableOptions = {
        filter: true,
        filterType: 'dropdown',
        responsive: 'standard',
        selectableRows: 'none'
    };

    return (
        <React.Fragment>
            <MuiThemeProvider theme={getMuiTheme()}>
                <MUIDataTable title={'ACME Employee list'} data={rows} columns={assetColumns} options={options} />
            </MuiThemeProvider>
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

export default AssetGrid;
