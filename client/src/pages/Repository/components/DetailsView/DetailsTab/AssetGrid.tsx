/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * AssetGrid
 *
 * This component renders asset grid tab for the DetailsTab component.
 */

import { Box, Button, Typography, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { NewTabLink, ToolTip } from '../../../../../components';
import { eSystemObjectType, eIcon, eAssetGridColumnType, eLinkOrigin } from '@dpo-packrat/common';
import { getObjectAssets } from '../../../hooks/useDetailsView';
import { getDownloadAllAssetsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { sharedButtonProps, formatDate, formatDateAndTime } from '../../../../../utils/shared';
import React, { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import { CheckCircleOutline, GetApp } from '@material-ui/icons';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import clsx from 'clsx';
import { DataTableOptions } from '../../../../../types/component';
import API from '../../../../../api';
import { truncateMiddleWithEllipses } from '../../../../../constants';
import { eIngestionMode } from '../../../../../constants';
import { UploadReferences } from '../../../../../store';

export const useStyles = makeStyles(({ palette }) => ({
    btn: {
        ...sharedButtonProps,
        width: 'fit-content',
        outline: '0.1px hidden rgb(255, 255, 224)'
    },
    tableContainer: {
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingBottom: '5px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        // need to specify top radius in table container AND MuiToolbar override
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        width: 'fit-content',
        minWidth: '400px'
    },
    centeredTableHead: {
        '& > span': {
            justifyContent: 'center'
        }
    },
    container: {
        background: palette.secondary.light,
        padding: 5,
        borderRadius: 5,
        marginBottom: 7,
        borderCollapse: 'collapse'
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
    emptyValue: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        paddingTop: 10,
        paddingBottom: 5
    },
    date: {
        fontSize: '0.8rem',
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
    tableCell: {
        padding: '1px 5px 1px 5px'
    },
    rollbackContainer: {
        display: 'flex',
        width: '90%',
        alignItems: 'center',
        columnGap: '10px'
    },
    ellipsisCell: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    fixedTable: {
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        width: '100%'
    },
    downloadIconLink: {
        textDecoration: 'none',
        color: 'black',
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'center'
    },
    rollbackText: {
        width: 'fit-content',
        whiteSpace: 'nowrap',
        color: 'rgb(0,121,196)',
        cursor: 'pointer'
    },
    evenTableRow: {
        backgroundColor: 'rgb(255, 255, 224)'
    },
    oddTableRow: {
        backgroundColor: 'white'
    }
}));

interface AssetGridProps {
    idSystemObject: number;
    systemObjectType?: eSystemObjectType;
    onUploaderOpen: (objectType: eIngestionMode, references: UploadReferences) => void;
}

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    height: 'fit-content',
                    padding: '0px 3px',
                    margin: '1px',
                    fontSize: '0.8em',
                },
                body: { color: '#2C405A', borderBottomColor: 'rgb(255, 255, 224)', align: 'center' }
            },
            MuiToolbar: {
                regular: {
                    // this is to address the default height behavior at this width
                    '@media (min-width: 600px)': {
                        minHeight: 'fit-content'
                    }
                },
                root: {
                    backgroundColor: 'rgb(255, 255, 224)',
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
                    borderBottom: '1.2px solid rgb(128,128,128)',
                    backgroundColor: 'rgb(255, 255, 224)',
                    '& button': {
                        padding: '0px 8px',
                        // Note: by default, these values are set so that header buttons are not horizontally aligned
                        // Set marginLeft and marginRight to 0 to center
                        marginLeft: 0,
                        marginRight: 0
                    }
                }
            },
            MuiButtonBase: {
                root: {
                    '&:focus': {
                        outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
                    },
                    outline: '0.1px hidden rgb(255, 255, 224)'
                }
            },
            MuiTypography: {
                h6: {
                    display: 'none'
                }
            },
        }
    });

function AssetGrid(props: AssetGridProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject, systemObjectType, onUploaderOpen } = props;
    const serverEndpoint = API.serverEndpoint();
    const [assetColumns, setAssetColumns] = useState<any>([]);
    const [assetRows, setAssetRows] = useState<any[]>([]);

    const cookieName = `${systemObjectType}AssetColumns`;

    useEffect(() => {
        const initializeColumnsAndRows = async () => {
            const { data: { getAssetDetailsForSystemObject: { columns, assetDetailRows } } } = await getObjectAssets(idSystemObject);
            if (!document.cookie.length || document.cookie.indexOf(cookieName) === -1)
                initializeAssetGridColumnCookie(cookieName, columns);

            const columnsToDisplay = getColumnsObjectByName(cookieName);
            const formattedColumns = columns.length > 0 ? formatToDataTableColumns(columns, classes, columnsToDisplay) : [];
            setAssetColumns(formattedColumns);
            setAssetRows(assetDetailRows);
        };

        initializeColumnsAndRows();
    }, []);

    const initializeAssetGridColumnCookie = (cookieName, columns) => {
        const columnsToDisplay = {};
        columns.forEach(column => columnsToDisplay[column.colName] = column.colDisplay);
        document.cookie = `${cookieName}=${JSON.stringify(columnsToDisplay)};path=/;max-age=630700000`;
    };

    const getColumnsObjectByName = (cookieName) => {
        let assetColumnsDisplay;
        assetColumnsDisplay = document.cookie.split(';');
        assetColumnsDisplay = assetColumnsDisplay.find(entry => entry.trim().startsWith(cookieName));
        if (assetColumnsDisplay)
            assetColumnsDisplay = JSON.parse(assetColumnsDisplay.split('=')[1]);
        if (typeof assetColumnsDisplay === 'object')
            return assetColumnsDisplay;
        return false;
    };

    const formatToDataTableColumns = (fields: any[], classes, displayHash): any[] => {
        const result: any[] = [];
        fields.forEach(async ({ colName, colType, colLabel, colAlign }) => {
            const gridColumnObject: any = {
                name: colName,
                label: colLabel,
                options: {
                    display: displayHash[colName] as boolean,
                    setCellHeaderProps: () => ({
                        className: clsx({
                            [classes.centeredTableHead]: true
                        })
                    }),
                    setCellProps:
                        colAlign === 'center' ? () => ({ align: 'center' }) :
                            colAlign === 'right'  ? () => ({ align: 'right' }) :
                                () => ({ align: 'left' })
                }
            };

            switch (colType) {
                case eAssetGridColumnType.eString:
                case eAssetGridColumnType.eNumber:
                    break;
                case eAssetGridColumnType.eBoolean:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return value ? <CheckCircleOutline /> : '';
                        }
                    };
                    break;
                case eAssetGridColumnType.eDate:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return (
                                <Tooltip arrow title={ <ToolTip text={formatDateAndTime(value)} /> }>
                                    <Typography className={classes.date}>{formatDate(value)}</Typography>
                                </Tooltip>
                            );
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
                        sortCompare: (order) => {
                            return (obj1, obj2) => {
                                const label1 = typeof obj1.data.label === 'string' ? obj1.data.label.toLowerCase() : obj1.data.path;
                                const label2 = typeof obj2.data.label === 'string' ? obj2.data.label.toLowerCase() : obj2.data.path;
                                let comparisonVal = 1;
                                if (label1 < label2) comparisonVal = -1;
                                return (order === 'asc') ? comparisonVal : -comparisonVal;
                            };
                        },
                        customBodyRender(value) {
                            if (value.label) {
                                if (value.origin === eLinkOrigin.eClient) {
                                    return (
                                        <NewTabLink to={value.path} style={{ textDecoration: 'underline', color: '#2C405A' }}>
                                            {value.label}
                                        </NewTabLink>
                                    );
                                } else if (value.origin === eLinkOrigin.eServer) {
                                    return (
                                        <a
                                            href={serverEndpoint + value.path}
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
                                        <NewTabLink to={value.path} style={{ color: 'black', display: 'flex' }}>
                                            {renderIcon(value.icon)}
                                        </NewTabLink>
                                    );
                                } else if (value.origin === eLinkOrigin.eServer) {
                                    return (
                                        <a
                                            href={serverEndpoint + value.path}
                                            style={{ textDecoration: 'underline', color: '#2C405A', display: 'flex' }}
                                        >
                                            <span style={{ display: 'none' }}>Download Icon</span>
                                            {renderIcon(value.icon)}
                                        </a>
                                    );
                                }
                            }

                            return (
                                <NewTabLink to={value.path} style={{ textDecoration: 'underline' }}>
                                    {value.path}
                                </NewTabLink>
                            );
                        }
                    };
                    break;
                case eAssetGridColumnType.eTruncate:
                    gridColumnObject.options = {
                        ...gridColumnObject.options,
                        customBodyRender(value) {
                            return (
                                <Tooltip arrow title={ <ToolTip text={value} /> }>
                                    <Typography className={classes.date}>
                                        {truncateMiddleWithEllipses(value, 6, 7)}
                                    </Typography>
                                </Tooltip>
                            );
                        }
                    };
                    break;
            }
            result.push(gridColumnObject);
        });
        return result;
    };

    const renderIcon = (type: eIcon) => {
        if (type === eIcon.eIconDownload) {
            return <GetApp />;
        }
        return;
    };

    const toggleColumn = (changedColumn: string, _action: string) => {
        const assetColumnsCopy = [...assetColumns];
        const column = assetColumnsCopy.find(col => col.name === changedColumn);
        if (column) {
            const columns = getColumnsObjectByName(cookieName);
            columns[changedColumn] = !columns[changedColumn];
            document.cookie = `${cookieName}=${JSON.stringify(columns)};path=/;max-age=630700000`;
            column.options.display = !column.options.display;
            setAssetColumns(assetColumnsCopy);
        }
    };

    let onAddVersion;
    if (assetRows.length > 0 && assetRows[0]) {
        const { idAsset } = assetRows[0];
        onAddVersion = () => onUploaderOpen(eIngestionMode.eUpdate, { idAsset });
    }


    const onAddAttachment = () => onUploaderOpen(eIngestionMode.eAttach, { idSOAttachment: idSystemObject });

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
        onViewColumnsChange: toggleColumn,
        setRowProps: (_row, _dataIndex, _rowIndex) => {
            return { className: _rowIndex % 2 !== 0 ? classes.oddTableRow : classes.evenTableRow };
        }
    };

    return (
        <React.Fragment>
            <MuiThemeProvider theme={getMuiTheme()}>
                <Box className={classes.tableContainer}>
                    {assetRows.length > 0 && (
                        <MUIDataTable title='Assets' data={assetRows} columns={assetColumns} options={options} />
                    )}
                    {assetRows.length === 0 && (
                        <Typography align='center' className={classes.emptyValue}>
                            No assets found
                        </Typography>
                    )}
                </Box>
            </MuiThemeProvider>

            <Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mt={1} width='100%'>
                <Box display='flex' flexDirection='row' alignItems='center'>
                    {assetRows.length > 0 && (
                        <Button disableElevation color='primary' variant='contained' className={classes.btn} style={{ whiteSpace: 'nowrap' }} href={getDownloadAllAssetsUrlForObject(serverEndpoint, idSystemObject)}>
                            Download All
                        </Button>
                    )}
                    <Button className={classes.btn} disableElevation variant='contained' color='primary' style={{ marginLeft: '2px' }} onClick={onAddVersion}>
                        Add Version
                    </Button>
                </Box>
                <Box display='flex' flexDirection='row' alignItems='center' style={{ alignSelf: 'flex-end' }}>
                    { systemObjectType === eSystemObjectType.eScene && (<Button className={classes.btn} disableElevation variant='contained' color='primary' onClick={onAddAttachment}>Add Attachment</Button>) }
                </Box>
            </Box>
        </React.Fragment>
    );
}

export default AssetGrid;
