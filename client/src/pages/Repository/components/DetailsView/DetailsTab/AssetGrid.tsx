/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { eSystemObjectType, eIcon, eAssetGridColumnType, eLinkOrigin } from '../../../../../types/server';
import { getObjectAssets } from '../../../hooks/useDetailsView';
import { getDownloadAllAssetsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { sharedButtonProps, formatDate } from '../../../../../utils/shared';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import { useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import GetAppIcon from '@material-ui/icons/GetApp';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { getDetailsUrlForObject, getDownloadAssetUrlForObject } from '../../../../../utils/repository';
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
    },
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
    }
}));

interface DataTableOptions {
    filter: boolean;
    filterType: string;
    responsive: string;
    selectableRows: string;
    search: boolean;
    download: boolean;
    print: boolean;
    fixedHeader: boolean;
    pagination: boolean;
    elevation: number;
    onViewColumnsChange: (change: string, action: string) => void;
}

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
    const history = useHistory();
    const [assetColumns, setAssetColumns] = useState<any>([]);
    const [assetRows, setAssetRows] = useState<any[]>([]);

    useEffect(() => {
        const initializeColumnsAndRows = async () => {
            const {
                data: {
                    getAssetDetailsForSystemObject: { columns, assetDetailRows }
                }
            } = await getObjectAssets(idSystemObject);

            if (columns) {
                const formattedColumns = formatToDataTableColumns(columns, classes);
                await setAssetColumns(formattedColumns);
            }

            if (assetDetailRows) {
                await setAssetRows(assetDetailRows);
            }
        };

        initializeColumnsAndRows();
    }, []);

    const formatToDataTableColumns = (fields: any[], classes): any[] => {
        const result: any[] = [];
        fields.forEach(async ({ colName, colType, colDisplay, colLabel, colAlign }) => {
            const gridColumnObject: any = {
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
                case eAssetGridColumnType.eString:
                case eAssetGridColumnType.eBoolean:
                case eAssetGridColumnType.eNumber:
                    break;
                case eAssetGridColumnType.eDate:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatDate(value);
                        }
                    };
                    break;
                case eAssetGridColumnType.eFileSize:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return formatBytes(Number(value));
                        }
                    };
                    break;
                case eAssetGridColumnType.eHyperLink:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            if (value.label) {
                                if (value.origin === eLinkOrigin.eClient) {
                                    return (
                                        <NewTabLink to={getDetailsUrlForObject(value.path)} style={{ textDecoration: 'underline', color: '#2C405A' }}>
                                            {value.label}
                                        </NewTabLink>
                                    );
                                } else if (value.origin === eLinkOrigin.eServer) {
                                    return (
                                        <a
                                            href={getDownloadAssetUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, value.path)}
                                            style={{ textDecoration: 'underline', color: '#2C405A' }}
                                        >
                                            {value.label}
                                        </a>
                                    );
                                }
                            }

                            if (value.icon !== null) {
                                if (value.origin === eLinkOrigin.eClient) {
                                    return (
                                        <NewTabLink to={getDetailsUrlForObject(value.path)} style={{ color: 'black', display: 'flex' }}>
                                            {renderIcon(value.icon)}
                                        </NewTabLink>
                                    );
                                } else if (value.origin === eLinkOrigin.eServer) {
                                    return (
                                        <a
                                            href={getDownloadAssetUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, value.path)}
                                            style={{ textDecoration: 'underline', color: '#2C405A', display: 'flex' }}
                                        >
                                            {renderIcon(value.icon)}
                                        </a>
                                    );
                                }
                            }

                            return (
                                <NewTabLink to={getDetailsUrlForObject(value.path)} style={{ textDecoration: 'underline' }}>
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

    const renderIcon = (type: eIcon) => {
        if (type === eIcon.eIconDownload) {
            return <GetAppIcon />;
        }
        return;
    };

    if (!assetColumns.length) {
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

    let redirect = () => {};
    if (assetRows[0]) {
        const { idAsset, idAssetVersion, assetType } = assetRows[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    const options: DataTableOptions = {
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
                {assetRows.length > 0 && (
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
