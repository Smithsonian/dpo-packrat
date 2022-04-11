/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ClearIcon from '@material-ui/icons/Clear';
import CheckIcon from '@material-ui/icons/Check';
import { DataGrid, GridColumns, GridCellValue } from '@material-ui/data-grid';
import { GetAllUsersResult } from '../../../types/graphql';
import { extractISOMonthDateYear } from '../../../constants/index';

const useStyles = makeStyles({
    AdminUsersListContainer: {
        marginTop: '15px',
        width: '1000px',
        padding: '20px',
        height: 'calc(100% - 120px)',
        display: 'flex',
        border: '1px solid #B7D2E5CC',
        margin: '1px solid #B7D2E5CC',
        alignItems: 'center',
        backgroundColor: '#687DDB1A',
        borderRadius: '4px'
    },
    UsersListDataGrid: {
        letterSpacing: '1.7px',
        color: '#8DABC4',
        border: '1px solid #B7D2E5CC',
        borderRadius: '2px',
        backgroundColor: 'white'
    }
});

function AdminUsersList({ users }: { users: GetAllUsersResult['User'] }): React.ReactElement {
    const classes = useStyles();

    // usersWithId is necessary because DataGrid only takes in objects with id
    const usersWithId = users.map(user => {
        const { idUser, Active, DateActivated, EmailAddress, Name, SecurityID, DateDisabled, EmailSettings, WorkflowNotificationTime } = user;

        return {
            id: idUser,
            idUser,
            Active,
            DateActivated,
            EmailAddress,
            Name,
            SecurityID,
            DateDisabled,
            EmailSettings,
            WorkflowNotificationTime
        };
    });

    const columnHeader: GridColumns = [
        {
            field: 'Active',
            headerName: 'Active',
            flex: 1,
            headerAlign: 'center',
            renderCell: params => (params.row.Active ? <CheckIcon color='primary' /> : <ClearIcon color='error' />)
        },
        {
            field: 'Name',
            headerName: 'Name',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.row.Name}`} arrow>
                    <div>{`${params.row.Name}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'EmailAddress',
            headerName: 'Email',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.row.EmailAddress}`} arrow>
                    <div>{`${params.row.EmailAddress}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'DateActivated',
            headerName: 'Date Activated',
            type: 'string',
            flex: 1.7,
            valueFormatter: params => extractISOMonthDateYearHelper(params.value)
        },
        {
            field: 'DateDisabled',
            headerName: 'Date Disabled',
            type: 'string',
            flex: 1.6,
            valueFormatter: params => extractISOMonthDateYearHelper(params.value)
        },
        {
            field: 'Action',
            headerName: 'Action',
            flex: 1,
            sortable: false,
            renderCell: params => <Link to={`/admin/users/${[params.row.idUser]}`}>Edit</Link>
        }
    ];

    return (
        <Box className={classes.AdminUsersListContainer}>
            <DataGrid
                className={classes.UsersListDataGrid}
                rows={usersWithId}
                columns={columnHeader}
                rowHeight={55}
                scrollbarSize={5}
                density='compact'
                disableSelectionOnClick
                disableColumnResize={undefined}
                hideFooter
            />
        </Box>
    );
}

function extractISOMonthDateYearHelper(iso: GridCellValue): string | null {
    if (typeof iso !== 'string' && !(iso instanceof Date)) return null;
    return extractISOMonthDateYear(iso);
}

export default AdminUsersList;
