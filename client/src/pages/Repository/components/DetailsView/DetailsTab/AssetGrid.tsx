/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * AssetGrid
 *
 * This component renders asset grid tab for the DetailsTab component.
 */

import { Box, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { NewTabLink, EmptyTable } from '../../../../../components';
import { eSystemObjectType, eIcon, eAssetGridColumntype } from '../../../../../types/server';
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
import clsx from 'clsx';

export const useStyles = makeStyles(({ palette }) => ({
    btn: sharedButtonProps,
    tableContainer: {
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingBottom: '5px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        // need to specify top radius in table container AND MuiToolbar override
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px'
    },
    centeredTableHead: {
        '& > span': {
            justifyContent: 'center'
        }
    }
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
                    backgroundColor: '#FFFCD1',
                    height: 'fit-content',
                    padding: '0px',
                    margin: '1px',
                    fontSize: '0.8em'
                },
                body: { color: '#2C405A', borderBottomColor: '#FFFCD1', align: 'center' }
            },
            MuiToolbar: {
                regular: {
                    // this is to address the default height behavior at this width
                    '@media (min-width: 600px)': {
                        minHeight: 'fit-content'
                    }
                },
                root: {
                    backgroundColor: '#FFFCD1',
                    borderTopRightRadius: '5px',
                    borderTopLeftRadius: '5px'
                }
            },
            MuiIconButton: {
                root: {
                    border: '0px',
                    padding: '0px'
                }
            },
            MuiTableHead: {
                root: {
                    borderBottom: '1.2px solid rgb(128,128,128)'
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
    const [assetRows, setAssetRows] = useState<any[]>([]);

    const formatToDataTableColumns = (fields: any[], classes): MUIDataTableColumn[] => {
        const result: MUIDataTableColumn[] = [];
        fields.forEach(async ({ colName, colType, colDisplay, colLabel, colAlign }) => {
            const gridColumnObject: MUIDataTableColumn = {
                name: colName,
                label: colLabel,
                options: {
                    display: colDisplay,
                    setCellHeaderProps: () => ({
                        className: clsx({
                            [classes.centeredTableHead]: true
                        })
                    }),
                    setCellProps:
                        colAlign === 'center'
                            ? () => ({
                                align: 'center'
                            })
                            : () => ({
                                align: 'left'
                            })
                }
            };

            switch (colType) {
                case eAssetGridColumntype.eString:
                case eAssetGridColumntype.eBoolean:
                case eAssetGridColumntype.eNumber:
                    break;
                case eAssetGridColumntype.eDate:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatDate(value);
                        }
                    };
                    break;
                case eAssetGridColumntype.eFileSize:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatBytes(value as number);
                        }
                    };
                    break;
                case eAssetGridColumntype.eHyperLink:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            if (value.label) {
                                return (
                                    <NewTabLink to={value.path} style={{ textDecoration: 'underline', color: '#2C405A' }}>
                                        {value.label}
                                    </NewTabLink>
                                );
                            }

                            if (value.icon !== null) {
                                return (
                                    <NewTabLink to={value.path} style={{ color: 'black', display: 'flex' }}>
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

    // const formatToDataGridRows = () => {
    //     // TODO: Write this out if rows data needs processing
    //     return [];
    // };

    const renderIcon = (type: eIcon) => {
        if (type === eIcon.eIconDownload) {
            return <GetAppIcon />;
        }
        return;
    };

    useEffect(() => {
        const initializeColumnsAndRows = async () => {
            // TODO: Replace this sampleColumns with columns definition from GQL
            // {
            //     colName: string
            //     colLabel: string
            //     colDisplay: boolean
            //     colType: eAssetGridColumnType
            //     colAlign: string
            // }
            const sampleColumns = [
                { colName: 'Link', colLabel: 'Link', colDisplay: true, colType: eAssetGridColumntype.eHyperLink, colAlign: 'center' },
                { colName: 'Name', colLabel: 'Name', colDisplay: true, colType: eAssetGridColumntype.eHyperLink, colAlign: 'left' },
                { colName: 'Path', colLabel: 'Path', colDisplay: true, colType: eAssetGridColumntype.eString, colAlign: 'left' },
                { colName: 'AssetType', colLabel: 'Asset Type', colDisplay: true, colType: eAssetGridColumntype.eString, colAlign: 'center' },
                { colName: 'Version', colLabel: 'Version', colDisplay: true, colType: eAssetGridColumntype.eNumber, colAlign: 'center' },
                { colName: 'DateCreated', colLabel: 'Date Created', colDisplay: true, colType: eAssetGridColumntype.eDate, colAlign: 'center' },
                { colName: 'Size', colLabel: 'Size', colDisplay: true, colType: eAssetGridColumntype.eFileSize, colAlign: 'center' }
            ];

            await setAssetColumns(formatToDataTableColumns(sampleColumns, classes));
            // TODO: Replace this sampleColumns with columns definition from GQL
            const sampleRows = [
                {
                    Size: 2348799003,
                    Link: { label: null, path: '/admin', icon: eIcon.eIconDownload },
                    Name: { label: 'helmet.jpeg', path: '/repository/details/1232', icon: null },
                    Path: '92c986d0-2b8d-43c1-8354-e9a2e80d0f9e.manual',
                    AssetType: 'Other',
                    Version: 1,
                    DateCreated: '7/2/2021'
                },
                {
                    Size: 799003,
                    Name: { label: 'nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb', path: '/repository/details/1232', icon: null },
                    Path: '92c986d0-2b8d-43c1-8354-e9a2e80d0f9e.manual/articles',
                    AssetType: 'Model Geometry File',
                    Version: 88,
                    DateCreated: '7/2/2021',
                    Link: { label: null, path: '/repository', icon: eIcon.eIconDownload }
                },
                {
                    Size: 2348,
                    Link: { label: null, path: '/dashboard', icon: eIcon.eIconDownload },
                    Name: { label: 'nmah-1981_0706_06-clemente_helmet-100k-2048-high.glb.jpeg', path: '/repository/details/1232', icon: null },
                    Path: '92c986d0-2b8d-43c1-8354-e9a2e80d0f9e.manual',
                    AssetType: 'Photogrammetry',
                    Version: 2,
                    DateCreated: '7/2/2021'
                }
            ];
            await setAssetRows(sampleRows);
        };

        initializeColumnsAndRows();
    }, []);

    if (!assetColumns || !data) {
        return <EmptyTable />;
    }

    const toggleColumn = (changedColumn: string, _action: string) => {
        const assetColumnsCopy = [...assetColumns];
        const column = assetColumnsCopy.find(col => col.field === changedColumn);
        if (column) {
            column.options.hide = !column.options.hide;
            setAssetColumns(assetColumnsCopy);
        }
    };

    const { assetDetails } = data.getAssetDetailsForSystemObject;

    let redirect = () => {};
    if (data.getAssetDetailsForSystemObject?.assetDetails?.[0]) {
        const { idAsset, idAssetVersion, assetType } = data.getAssetDetailsForSystemObject?.assetDetails?.[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    const options: MUIDataTableOptions = {
        filter: false,
        filterType: 'dropdown',
        responsive: 'standard',
        selectableRows: 'none',
        search: false,
        download: false,
        print: false,
        fixedHeader: false,
        pagination: false,
        elevation: 0,
        onViewColumnsChange: toggleColumn
    };

    return (
        <React.Fragment>
            <MuiThemeProvider theme={getMuiTheme()}>
                <Box className={classes.tableContainer}>
                    <MUIDataTable title='' data={assetRows} columns={assetColumns} options={options} />
                </Box>
            </MuiThemeProvider>

            <Box display='flex' flexDirection='row' alignItems='center' mt={1}>
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
