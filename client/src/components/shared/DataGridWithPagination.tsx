/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Box, TextField, Button, FormControl, Select, MenuItem, InputLabel, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataGrid, GridColumns, GridSortModel, GridSortModelParams, GridPageChangeParams } from '@material-ui/data-grid';
import { useHistory } from 'react-router-dom';
import Clear from '@material-ui/icons/Clear';

const useStyles = makeStyles(({ palette, typography }) => ({
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
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    searchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        height: '70px',
        width: 'fit-content',
        backgroundColor: '#FFFCD1',
        paddingLeft: '20px',
        paddingRight: '20px'
    },
    searchFilterSettingsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '85%',
        '& > *': {
            marginRight: '8px'
        }
    },
    searchFilterSettingsContainer2: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '15%'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    select: {
        minWidth: 70,
        width: 'fit-content',
        height: 30,
        marginLeft: 10,
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`
    },
    searchFilter: {
        width: '380px'
    },
    selectLabel: {
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: 'inherit',
        color: 'black'
    },
    labelSelectContainer: {
        display: 'flex',
        alignItems: 'center',
        width: 'fit-content'
    }
}));

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
    sortModel: GridSortModel;
};

// TODO: include additional prop for styling
type DataGridWithPaginationProps = {
    DropDown?: DropDown;
    LinkBtn?: LinkBtn;
    Search: Search;
    PaginationSettings: PaginationSettings;
    SortSettings: SortSettings;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[];
    columnHeader: GridColumns;
    loading: boolean;
    handlePaginationChange: (params: GridPageChangeParams) => void;
    handleDropDownChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSortChange: (params: GridSortModelParams) => void;
    handleSearchKeywordChange: (value: string) => void;
    handleSearch: (reset: boolean) => void;
    searchType: string;
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
        handleSearch,
        searchType
    } = props;
    const history = useHistory();
    const classes = useStyles();

    const handleDropDown = handleDropDownChange
        ? ({ target }) => {
            handleDropDownChange(target.value);
        }
        : () => {};

    const handleSearchKeyword = ({ target }) => handleSearchKeywordChange(target.value);

    const calculateRowCountFooter = (): number => {
        if (PaginationSettings.pageNumber === 0 && rows.length < PaginationSettings.rowCount) {
            return rows.length;
        } else if (rows.length < PaginationSettings.rowCount) {
            return PaginationSettings.pageNumber * PaginationSettings.rowCount + rows.length;
        }
        // +1 allows pagination to work
        return (PaginationSettings.pageNumber + 1) * PaginationSettings.rowCount + 1;
    };

    return (
        <Box className={classes.Container}>
            <Box className={classes.searchFilterContainer}>
                <Box className={classes.searchFilterSettingsContainer}>
                    <label htmlFor='searchFilter' style={{ display: 'none' }}>Search {searchType}</label>
                    <TextField
                        className={classes.searchFilter}
                        placeholder={Search.placeholderText || ''}
                        value={Search.text}
                        id='searchFilter'
                        name='searchFilter'
                        onChange={handleSearchKeyword}
                        InputProps={{
                            endAdornment: Search.text.length ? (
                                <IconButton size='small' onClick={async () => await handleSearch(true)}>
                                    <Clear style={{ height: '16px' }} />
                                </IconButton>
                            ) : null
                        }}
                    />
                    {DropDown && (
                        <Box className={classes.labelSelectContainer}>
                            <InputLabel htmlFor='searchDropdown' className={classes.selectLabel}>{DropDown.name}</InputLabel>
                            <FormControl style={{ width: 'fit-content', marginRight: '40px' }}>
                                <Select
                                    value={DropDown.value}
                                    className={classes.select}
                                    style={{ minWidth: '50px', height: '30px', fontSize: 'inherit', width: 'inherit' }}
                                    onChange={handleDropDown}
                                    id='searchDropdown'
                                    disableUnderline
                                    SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}
                                >
                                    {DropDown.options.map(option => (
                                        <MenuItem value={option.value} key={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                    <Button className={classes.FilterBtn} onClick={async () => await handleSearch(false)}>
                        {Search.btnText || 'Search'}
                    </Button>
                </Box>
                {LinkBtn && (
                    <Box className={classes.searchFilterSettingsContainer2}>
                        <Button className={classes.FilterBtn} onClick={() => history.push(LinkBtn.link)}>{LinkBtn.btnText || 'Create'}</Button>
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
                    hideFooterRowCount
                    rowCount={calculateRowCountFooter()}
                    sortingOrder={['asc', 'desc']}
                />
            </Box>
        </Box>
    );
}

export default DataGridWithPagination;
