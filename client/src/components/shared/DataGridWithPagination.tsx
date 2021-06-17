import React from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, FormControl, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataGrid, Columns, SortModel, SortModelParams } from '@material-ui/data-grid';

const useStyles = makeStyles({
    Container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingLeft: '1%',
        width: '1200px',
        margin: '0 auto'
    },
    DataGridContainer: {
        marginTop: '2%',
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
    DataGrid: {
        letterSpacing: '1.7px',
        color: '#8DABC4',
        border: '1px solid #B7D2E5CC',
        borderRadius: '2px',
        backgroundColor: 'white'
    },
    FilterBtn: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
    },
    searchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        height: '70px',
        width: '900px',
        backgroundColor: '#FFFCD1',
        paddingLeft: '20px',
        paddingRight: '20px'
    },
    searchFilterSettingsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%'
    },
    searchFilterSettingsContainer2: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    searchFilter: {
        width: '380px'
    }
});

type DropDownOption = {
    value: string | number;
    label: string | number;
};

export type DropDown = {
    name: string;
    value: string | number;
    options: DropDownOption[];
    onChange: () => void;
};

export type Search = {
    text: string;
    placeholderText?: string;
    onChange: () => void;
    onSearch: () => void;
    btnText?: string;
};

export type ExtraBtn = {
    link: string;
    btnText?: string;
};

export type PaginationSettings = {
    pageNumber: number;
    rowCount: number;
    sortBy: SortModel;
    sortOrder: string;
    rowsPerPage?: number[];
};

type DataGridWithPaginationProps = {
    DropDown?: DropDown;
    ExtraBtn?: ExtraBtn;
    Search: Search;
    PaginationSettings: PaginationSettings;
    rows: any[];
    columnHeader: Columns;
    loading: boolean;
};

function DataGridWithPagination(props: DataGridWithPaginationProps): React.ReactElement {
    const { DropDown, ExtraBtn, Search, PaginationSettings, rows, columnHeader, loading } = props;
    const classes = useStyles();

    const handleSortModelChange = (params: SortModelParams) => {
        // if (params.sortModel !== sortModel) {
        //     setSortModel(params.sortModel);
        // }
        console.log('params from handleSortModelChange', params);
    };

    return (
        <Box className={classes.Container}>
            <Box className={classes.searchFilterContainer}>
                <Box className={classes.searchFilterSettingsContainer}>
                    <TextField
                        className={classes.searchFilter}
                        placeholder={Search.placeholderText || ''}
                        type='search'
                        value={Search.text}
                        id='searchFilter'
                        onChange={Search.onChange}
                    />
                    {DropDown && (
                        <React.Fragment>
                            <p>{DropDown.name}</p>
                            <FormControl variant='outlined' style={{ right: '25px' }}>
                                <Select value={DropDown.value} className={classes.formField} style={{ height: '30px', width: '100px' }} onChange={DropDown.onChange}>
                                    {DropDown.options.map(option => (
                                        <MenuItem value={option.value} key={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </React.Fragment>
                    )}
                    <Button className={classes.FilterBtn} style={{ right: '25px' }} onClick={Search.onSearch}>
                        {Search.btnText || 'Search'}
                    </Button>
                </Box>
                {ExtraBtn && (
                    <Box className={classes.searchFilterSettingsContainer2}>
                        <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to={ExtraBtn.link}>
                            <Button className={classes.FilterBtn}>{ExtraBtn.btnText || 'Create'}</Button>
                        </Link>
                    </Box>
                )}
            </Box>

            <Box className={classes.DataGridContainer}>
                <DataGrid
                    className={classes.DataGrid}
                    rows={rows}
                    columns={columnHeader}
                    rowHeight={55}
                    scrollbarSize={5}
                    density='compact'
                    disableSelectionOnClick
                    disableColumnResize={undefined}
                    sortingMode='server'
                    paginationMode='server'
                    sortingOrder={['asc', 'desc']}
                    rowsPerPageOptions={PaginationSettings.rowsPerPage}
                    pageSize={PaginationSettings.rowCount}
                    page={PaginationSettings.pageNumber}
                    loading={loading}
                    sortModel={PaginationSettings.sortBy}
                    onSortModelChange={handleSortModelChange}
                    onPageSizeChange={params => {
                        console.log('params from onPageSizeChange', params);
                    }}
                    onPageChange={params => {
                        console.log('params from onPageChange', params);
                    }}
                />
            </Box>
        </Box>
    );
}

export default DataGridWithPagination;
