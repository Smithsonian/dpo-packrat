/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */

import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ClearIcon from '@material-ui/icons/Clear';
import CheckIcon from '@material-ui/icons/Check';
import { GetAllUsersResult } from '../../../types/graphql';
import { extractISOMonthDateYear } from '../../../constants/index';
import DataTable from './shared/DataTable';
import { DataTableOptions } from '../../../types/component';
import clsx from 'clsx';

const useStyles = makeStyles({
    centeredTableHead: {
        '& > span': {
            '& > button': {
                marginRight: 0,
                marginLeft: '0px',
                '&:focus': {
                    outline: '0.5px solid #8DABC4'
                }
            },
            justifyContent: 'center'
        }
    },
    evenTableRow: {
        backgroundColor: 'rgb(255, 255, 224)'
    },
    oddTableRow: {
        backgroundColor: 'white'
    },
    tableContainer: {
        marginTop: 15
    }
});

function AdminUsersList({ users }: { users: GetAllUsersResult['User'] }): React.ReactElement {
    const classes = useStyles();
console.log(users);

    const dataTableOptions: DataTableOptions = {
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
        setRowProps: (_row, _dataIndex, _rowIndex) => {
            return { className: _rowIndex % 2 !== 0 ? classes.oddTableRow : classes.evenTableRow };
        }
    };

    const setCenterCell = () => ({ align: 'center' });
    const setCenterHeader = () => {
        return {
            className: clsx({
                [classes.centeredTableHead]: true
            }),
        };
    };

    const columns = [
        {
            name: 'Active',
            label: 'Active',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                customBodyRender(value) {
                    return value ? <CheckIcon color='primary' style={{ height: 15, verticalAlign: 'text-bottom' }} /> : <ClearIcon color='error' style={{ height: 15, verticalAlign: 'text-bottom' }} />;
                }
            }
        },
        {
            name: 'Name',
            label: 'Name',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'EmailAddress',
            label: 'Email',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'SlackID',
            label: 'Slack ID',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'DateActivated',
            label: 'Date Activated',
            options: {
                setCellProps: setCenterCell,
                customBodyRender(value) {
                    return extractISOMonthDateYear(value);
                }
            }
        },
        {
            name: 'DateDisabled',
            label: 'Date Disabled',
            options: {
                setCellProps: setCenterCell,
                customBodyRender(value) {
                    return extractISOMonthDateYear(value);
                }
            }
        },
        {
            name: 'idUser',
            label: 'Action',
            options: {
                setCellProps: setCenterCell,
                customBodyRender(value) {
                    return <Link to={`/admin/users/${value}`}>Edit</Link>;
                },
                sort: false
            }
        }
    ];

    return (
        <Box className={classes.tableContainer}>
            <DataTable title='users' columns={columns} data={users} options={dataTableOptions} />
        </Box>
    );
}


export default AdminUsersList;
