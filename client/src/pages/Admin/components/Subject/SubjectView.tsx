/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import { Box, InputLabel, FormControl, IconButton, TextField, Button, Select, MenuItem, TablePagination } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { Link, useHistory } from 'react-router-dom';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';
import { getUnitsList, getSubjectList } from '../../hooks/useAdminView';
import { SubjectUnitIdentifier } from '../../../../types/graphql';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet';
import { eSubjectUnitIdentifierSortColumns } from '@dpo-packrat/common';
import DataTable from '../shared/DataTable';
import { DataTableOptions } from '../../../../types/component';
import clsx from 'clsx';
import Clear from '@material-ui/icons/Clear';
import { ePaginationChange } from '../../../../store';
import { EmptyTable } from '../../../../components';

const useStyles = makeStyles(({ typography, palette }) => ({
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
    },
    AdminViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingLeft: '15px',
        paddingBottom: '15px'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '15px',
        width: 'fit-content'
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        width: 'max-content',
        backgroundColor: 'rgb(255, 255, 224)',
        padding: '10px 10px',
        fontSize: '0.8rem',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        borderRadius: 5
    },
    searchFilterContainerLeft: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        columnGap: 10
    },
    searchFilterContainerRight: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
    },
    searchFilter: {
        width: '250px'
    },
    labelSelectContainer: {
        display: 'flex',
        alignItems: 'center',
        width: 'fit-content'
    },
    filterLabel: {
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: 'inherit',
        color: 'black'
    },
    select: {
        minWidth: 70,
        width: 'fit-content',
        height: 25,
        marginLeft: 10,
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        fontSize: 'inherit'
    },
    styledButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '75px',
        height: '25px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
        fontSize: '0.8rem'
    },
    footerBtn: {
        '&:focus': {
            outline: '0.5px solid #8DABC4'
        }
    },
    footerControls: {
        borderBottomColor: 'rgb(255, 255, 224) !important'
    },
    empty: {
        height: '400px',
        width: '80%'
    },
    toolbar: {
        '& > *': {
            fontSize: '0.8rem'
        }
    }
}));

interface selectOption {
    label: string;
    value: number;
}

interface SearchFilterProps {
    units: selectOption[],
    queryByFilter: (reset?: boolean) => Promise<void>,
    onSelect: (value: number) => void,
    onKeywordChange: (value: string) => void,
    selectedUnit: number,
    keyword: string
}

interface ListProps {
    pageNumber: number;
    rowsPerPage: number;
    sortBy: eSubjectUnitIdentifierSortColumns;
    sortOrder: boolean;
    onPaginationChange: (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null) => void;
    subjects: SubjectUnitIdentifier[];
    loading: boolean;
}

function SubjectList(props: ListProps): React.ReactElement {
    const { subjects, onPaginationChange, sortBy, sortOrder, rowsPerPage, pageNumber, loading } = props;
    const classes = useStyles();

    const calculateTotalRowCount = (): number => {
        if (pageNumber === 0 && subjects.length < rowsPerPage) {
            return subjects.length;
        } else if (subjects.length < rowsPerPage) {
            return pageNumber * rowsPerPage + subjects.length;
        }
        return -1;
    };

    const count = calculateTotalRowCount();
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
        },
        rowsPerPageOptions: [50, 100],
        sortOrder: {
            name: subjectUnitIdentifierEnumToString(sortBy),
            direction: sortOrder ? 'asc' : 'desc'
        },
        onColumnSortChange: (changedColumn: string, direction: string) => onPaginationChange(ePaginationChange.eSort, null, changedColumn, direction),
        customTableBodyFooterRender: function Pagination() {
            return (
                <tfoot>
                    <tr>
                        <TablePagination
                            page={pageNumber}
                            rowsPerPage={rowsPerPage}
                            count={count}
                            onChangeRowsPerPage={({ target: { value } }) => onPaginationChange(ePaginationChange.eRowCount, Number(value), null, null)}
                            onChangePage={(_e, currentPage) => onPaginationChange(ePaginationChange.ePage, currentPage, null, null)}
                            backIconButtonProps={{ className: classes.footerBtn }}
                            nextIconButtonProps={{ className: classes.footerBtn }}
                            rowsPerPageOptions={[50, 100]}
                            className={classes.footerControls}
                            classes={{ toolbar: classes.toolbar }}
                        />
                    </tr>
                </tfoot>
            );
        },
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
            name: 'UnitAbbreviation',
            label: 'Unit',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'SubjectName',
            label: 'Name',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'IdentifierPublic',
            label: 'Identifier',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'idSystemObject',
            label: 'Action',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                customBodyRender(value) {
                    return <Link to={`/repository/details/${value}`}>Edit</Link>;
                },
                sort: false
            }
        }
    ];

    if (loading) {
        return (
            <Box className={classes.empty}>
                <EmptyTable />
            </Box>
        );
    }

    return (
        <Box className={classes.tableContainer}>
            <DataTable columns={columns} data={subjects} title='subjects' options={dataTableOptions} />
        </Box>
    );
}


function SearchFilter(props: SearchFilterProps): React.ReactElement {
    const { units, queryByFilter, onSelect, onKeywordChange, selectedUnit, keyword } = props;
    const history = useHistory();
    const classes = useStyles();

    const handleSelectChange = e => {
        onSelect(e.target.value);
    };

    const handleSearchFilterChange = e => {
        onKeywordChange(e.target.value);
    };

    return (
        <Box className={classes.filterContainer}>
            <Box className={classes.searchFilterContainerLeft}>
                <label htmlFor='searchFilter' style={{ display: 'none' }}>Seach Subject</label>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Subject'
                    value={keyword}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                    InputProps={{
                        endAdornment: keyword.length ? (
                            <IconButton size='small' onClick={() => queryByFilter(true)}>
                                <Clear style={{ height: '16px' }} />
                            </IconButton>
                        ) : null,
                        style: { fontSize: '0.8rem' }
                    }}
                />
                <Box className={classes.labelSelectContainer}>
                    <InputLabel htmlFor='unitSelected' className={classes.filterLabel}>Unit</InputLabel>
                    <FormControl className={classes.filterLabel}>
                        <Select
                            id='unitSelected'
                            disableUnderline
                            value={selectedUnit}
                            className={classes.select}
                            onChange={handleSelectChange}
                            name='unitSelected'
                            displayEmpty
                            SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}
                        >
                            {units.map(({ value, label }) => (
                                <MenuItem value={value} key={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Button
                    className={classes.styledButton}
                    onClick={() => queryByFilter()}
                    variant='contained'
                    disableElevation
                >
                    Search
                </Button>
            </Box>
            <Box className={classes.searchFilterContainerRight}>
                <Button
                    className={classes.styledButton}
                    onClick={() => history.push('/admin/subjects/create')}
                    variant='contained'
                    disableElevation
                >
                    Create
                </Button>
            </Box>
        </Box>
    );
}

function SubjectView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const [pageNumber, setPageNumber] = useState(0);
    const [rowCount, setRowCount] = useState(50);
    const [sortOrder, setSortOrder] = useState(true);
    const [sortBy, setSortBy] = useState<eSubjectUnitIdentifierSortColumns>(eSubjectUnitIdentifierSortColumns.eDefault);
    const [keyword, setKeyword] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [subjectList, setSubjectList] = useState<SubjectUnitIdentifier[]>([]);
    const [units, setUnits] = useState<selectOption[]>([{ value: 0, label: 'All' }]);
    const [selectedUnit, setSelectedUnit] = useState<number>(0);

    useEffect(() => {
        const fetchUnitList = async () => {
            const { data } = await getUnitsList();
            if (data?.getUnitsFromNameSearch.Units && data?.getUnitsFromNameSearch.Units.length) {
                const fetchedUnitList = data?.getUnitsFromNameSearch.Units.slice();
                if (fetchedUnitList && fetchedUnitList.length) fetchedUnitList.sort((a, b) => a.Name.localeCompare(b.Name));
                const unitListOptions = fetchedUnitList.map(unit => {
                    return { value: unit.idUnit, label: unit.Name };
                });
                unitListOptions.unshift({ value: 0, label: 'All' });
                setUnits(unitListOptions);
            }
        };
        fetchUnitList();
    }, []);

    useEffect(() => {
        fetchSubjectList();
    }, [pageNumber, rowCount, sortOrder, sortBy]);

    const fetchSubjectList = async () => {
        setLoading(true);
        try {
            const getSubjectListInput = {
                search: keyword,
                idUnit: selectedUnit,
                // pageNumber + 1 because Material UI requires starting page === 0
                pageNumber: pageNumber + 1,
                rowCount,
                sortBy,
                sortOrder
            };
            const { data } = await getSubjectList(getSubjectListInput);
            if (data?.getSubjectList.subjects && data?.getSubjectList.subjects.length) {
                setSubjectList(data?.getSubjectList.subjects);
            } else {
                setSubjectList([]);
            }
        } catch (error) {
            toast.error(`Error in fetching subjects. Message: ${error}`);
        }
        setLoading(false);
    };

    const onSearch = async (reset: boolean = false) => {
        if (reset) {
            await setKeyword('');
            await setSelectedUnit(0);
            await setPageNumber(0);
        }
        await setLoading(true);
        try {
            const getSubjectListInput = {
                search: reset ? '' : keyword,
                idUnit: reset ? 0 : selectedUnit,
                pageNumber,
                rowCount,
                sortBy,
                sortOrder
            };
            const { data } = await getSubjectList(getSubjectListInput);
            if (data?.getSubjectList.subjects && data?.getSubjectList.subjects.length) {
                setSubjectList(data.getSubjectList.subjects);
            } else {
                setSubjectList([]);
            }
        } catch (error) {
            toast.error(`Error in fetching subjects. Message: ${error}`);
        }
        setLoading(false);
    };

    const paginationUpdateAndRefetchList = (changeType: ePaginationChange, value?: number | null, column?: string | null, direction?: string | null): void => {
        if (changeType === ePaginationChange.ePage && value !== null) setPageNumber(value as number);

        if (changeType === ePaginationChange.eRowCount && value !== null) {
            setRowCount(value as number);
            setPageNumber(0);
        }

        if (changeType === ePaginationChange.eSort && column) {
            setPageNumber(0);
            setSortOrder(direction === 'asc' ? true : false);
            setSortBy(subjectUnitIdentifierStringToEnum(column));
        }
    };
    const handleDropDownChange = value => setSelectedUnit(value);
    const handleSearchKeywordChange = value => setKeyword(value);

    return (
        <Box className={classes.AdminViewContainer}>
            <Helmet>
                <title>Subjects Admin</title>
            </Helmet>
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} />
            </Box>
            <SearchFilter
                queryByFilter={onSearch}
                units={units}
                onSelect={handleDropDownChange}
                onKeywordChange={handleSearchKeywordChange}
                keyword={keyword}
                selectedUnit={selectedUnit}
            />
            <SubjectList
                subjects={subjectList}
                onPaginationChange={paginationUpdateAndRefetchList}
                pageNumber={pageNumber}
                rowsPerPage={rowCount}
                sortBy={sortBy}
                sortOrder={sortOrder}
                loading={loading}
            />
        </Box>
    );
}

const subjectUnitIdentifierStringToEnum = (col: string): eSubjectUnitIdentifierSortColumns => {
    switch (col) {
        case 'UnitAbbreviation': return eSubjectUnitIdentifierSortColumns.eUnitAbbreviation;
        case 'SubjectName': return eSubjectUnitIdentifierSortColumns.eSubjectName;
        case 'IdentifierPublic': return eSubjectUnitIdentifierSortColumns.eIdentifierValue;
        default: return eSubjectUnitIdentifierSortColumns.eDefault;
    }
};

const subjectUnitIdentifierEnumToString = (col: eSubjectUnitIdentifierSortColumns): string => {
    switch (col) {
        case eSubjectUnitIdentifierSortColumns.eIdentifierValue: return 'IdentifierPublic';
        case eSubjectUnitIdentifierSortColumns.eSubjectName: return 'SubjectName';
        case eSubjectUnitIdentifierSortColumns.eUnitAbbreviation: return 'UnitAbbreviation';
        default: return 'Default';
    }
};

export default SubjectView;
