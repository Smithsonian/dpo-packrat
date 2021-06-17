/* eslint-disable react/display-name */
import React, { useState } from 'react';
import DataGridWithPagination, { Search, PaginationSettings, DropDown } from '../../../../components/shared/DataGridWithPagination';
import { Tooltip } from '@material-ui/core';
import { Columns } from '@material-ui/data-grid';

function SubjectView(): React.ReactElement {
    const [paginationState] = useState<PaginationSettings>({ pageNumber: 0, rowCount: 2, sortOrder: 'asc', sortBy: [{ field: 'unit', sort: 'asc' }], rowsPerPage: [1, 2, 3] });
    const [searchState] = useState<Search>({ text: '', onChange: () => {}, onSearch: () => {} });
    const [dropDownState] = useState<DropDown>({ name: '', value: 1, options: [{ value: 1, label: 'hi' }], onChange: () => {} });
    const [loading] = useState(false);
    /* Create state for
        pagination: {pagenumber, rowcount, sortby, sortorder}
        search: {value}
        dropDown: {options}
        queryResult: {}
    */

    /*
        Component Workflow
            useEffect for fetching query and setting it to state
            pass the results down to DataGrid

    */

    const rows = [
        {
            id: 1,
            EmailAddress: 'tysonj@si.edu',
            Name: 'Jon Tyson',
            DateDisabled: null,
            DateActivated: '2021-06-02T18:17:43.000Z',
            Active: true
        },
        {
            id: 2,
            EmailAddress: 'blundellj@si.edu',
            Name: 'Jon Blundell',
            DateDisabled: null,
            DateActivated: '2021-06-02T18:17:43.000Z',
            Active: true
        },
        {
            id: 3,
            EmailAddress: 'rossiv@si.edu',
            Name: 'Vince Rossi',
            DateDisabled: null,
            DateActivated: '2021-06-02T18:17:43.000Z',
            Active: true
        },
        {
            id: 4,
            EmailAddress: 'copeg@si.edu',
            Name: 'Jamie Cope',
            DateDisabled: null,
            DateActivated: '2021-06-02T18:17:43.000Z',
            Active: true
        },
        {
            id: 5,
            EmailAddress: 'tungh@si.edu',
            Name: 'Hsin Tung',
            DateDisabled: null,
            DateActivated: '2021-06-02T18:17:43.000Z',
            Active: true
        }
    ];

    const columnHeader: Columns = [
        {
            field: 'Active',
            headerName: 'Active',
            flex: 1,
            headerAlign: 'center',
            renderCell: params => (params.getValue('Active') ? <span>Active</span> : <span>Inactive</span>)
        },
        {
            field: 'Name',
            headerName: 'Name',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.getValue('Name')}`} arrow>
                    <div>{`${params.getValue('Name')}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'EmailAddress',
            headerName: 'Email',
            flex: 1.7,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.getValue('EmailAddress')}`} arrow>
                    <div>{`${params.getValue('EmailAddress')}`}</div>
                </Tooltip>
            )
        }
    ];
    return (
        <DataGridWithPagination
            loading={loading}
            PaginationSettings={paginationState}
            ExtraBtn={{ link: '/', btnText: 'Create' }}
            rows={rows}
            columnHeader={columnHeader}
            Search={searchState}
            DropDown={dropDownState}
        />
    );
}

export default SubjectView;
