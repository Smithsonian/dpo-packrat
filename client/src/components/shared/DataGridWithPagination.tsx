/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, FormControl, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataGrid, Columns, SortModel, SortModelParams, PageChangeParams } from '@material-ui/data-grid';

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
    value: number;
    options: DropDownOption[];
};

export type Search = {
    text: string;
    placeholderText?: string;
    btnText?: string;
};

export type LinkBtn = {
    link: string;
    btnText?: string;
    target?: string;
};

export type PaginationSettings = {
    pageNumber: number;
    rowCount: number;
    rowsPerPage?: number[];
};

export type SortSettings = {
    sortModel: SortModel;
};

// TODO: include additional prop for styling
type DataGridWithPaginationProps = {
    DropDown?: DropDown;
    LinkBtn?: LinkBtn;
    Search: Search;
    PaginationSettings: PaginationSettings;
    SortSettings: SortSettings;
    rows: any[];
    columnHeader: Columns;
    loading: boolean;
    handlePaginationChange: (params: PageChangeParams) => void;
    handleDropDownChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSortChange: (params: SortModelParams) => void;
    handleSearchKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearch: () => void;
};

function DataGridWithPagination(props: DataGridWithPaginationProps): React.ReactElement {
    const {
        DropDown,
        LinkBtn,
        Search,
        PaginationSettings,
        SortSettings,
        rows,
        columnHeader,
        loading,
        handlePaginationChange,
        handleDropDownChange,
        handleSortChange,
        handleSearchKeywordChange,
        handleSearch
    } = props;
    const classes = useStyles();

    const handleDropDown = handleDropDownChange
        ? ({ target }) => {
            handleDropDownChange(target.value);
        }
        : () => {};

    const handleSearchKeyword = ({ target }) => handleSearchKeywordChange(target.value);

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
                        onChange={handleSearchKeyword}
                    />
                    {DropDown && (
                        <React.Fragment>
                            <p>{DropDown.name}</p>
                            <FormControl variant='outlined' style={{ right: '25px' }}>
                                <Select value={DropDown.value} className={classes.formField} style={{ height: '30px', width: '100px' }} onChange={handleDropDown}>
                                    {DropDown.options.map(option => (
                                        <MenuItem value={option.value} key={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </React.Fragment>
                    )}
                    <Button className={classes.FilterBtn} style={{ right: '25px' }} onClick={handleSearch}>
                        {Search.btnText || 'Search'}
                    </Button>
                </Box>
                {LinkBtn && (
                    <Box className={classes.searchFilterSettingsContainer2}>
                        <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to={LinkBtn.link} target={LinkBtn.target || '_self'}>
                            <Button className={classes.FilterBtn}>{LinkBtn.btnText || 'Create'}</Button>
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
                    rowsPerPageOptions={PaginationSettings.rowsPerPage}
                    pageSize={PaginationSettings.rowCount}
                    page={PaginationSettings.pageNumber}
                    loading={loading}
                    sortModel={SortSettings.sortModel}
                    onSortModelChange={handleSortChange}
                    onPageSizeChange={handlePaginationChange}
                    onPageChange={handlePaginationChange}
                />
            </Box>
        </Box>
    );
}

export default DataGridWithPagination;
