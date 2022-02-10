/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import DataGridWithPagination, { Search, DropDown, PaginationSettings, SortSettings } from '../../../../components/shared/DataGridWithPagination';
import { Tooltip, Box } from '@material-ui/core';
import { GridColumns, GridPageChangeParams, GridSortModelParams } from '@material-ui/data-grid';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';
import { getUnitsList, getSubjectList } from '../../hooks/useAdminView';
import { resolveSubRoute, ADMIN_ROUTE, ADMIN_ROUTES_TYPE } from '../../../../constants/routes';
import { Subject } from '../../../../types/graphql';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet';
import { eSubjectUnitIdentifierSortColumns } from '../../../../types/server';

const useStyles = makeStyles({
    AdminViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingLeft: '1%',
        width: '1200px'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '2%',
        width: 'fit-content'
    }
});

function SubjectView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const [paginationState, setPaginationState] = useState<PaginationSettings>({
        pageNumber: 0,
        rowCount: 25,
        rowsPerPage: [25, 50, 100]
    });
    const [searchState, setSearchState] = useState<Search>({
        text: '',
        placeholderText: 'Search Subject'
    });
    const [dropDownState, setDropDownState] = useState<DropDown>({
        name: 'Units',
        value: 0,
        options: [{ value: 0, label: 'All' }]
    });
    const [sortState, setSortState] = useState<SortSettings>({
        sortModel: []
    });
    const [loading, setLoading] = useState(false);
    const [subjectListState, setSubjectListState] = useState<Subject[]>([]);

    const columnHeader: GridColumns = [
        {
            field: 'Unit',
            headerName: 'Unit',
            flex: 1,
            headerAlign: 'center',
            renderCell: params => (
                <Tooltip placement='left' title={`${params.row.Unit}`} arrow>
                    <div>{`${params.row.Unit}`}</div>
                </Tooltip>
            )
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
            field: 'Identifier',
            headerName: 'Identifier',
            flex: 1.7,
            renderCell: params => <div>{`${params.row.Identifier}`}</div>
        },
        {
            field: 'Action',
            headerName: 'Action',
            flex: 1,
            sortable: false,
            renderCell: params => <Link to={`/repository/details/${[params.row.idSystemObject]}`}>Edit</Link>
        }
    ];

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
                setDropDownState({ ...dropDownState, options: unitListOptions });
            }
        };
        fetchUnitList();
    }, []);

    useEffect(() => {
        fetchSubjectList();
        // console.log('sortModel', sortState.sortModel);
    }, [paginationState.pageNumber, paginationState.rowCount, sortState.sortModel]);

    const fetchSubjectList = async () => {
        setLoading(true);
        try {
            const getSubjectListInput = {
                search: searchState.text,
                idUnit: dropDownState.value,
                // pageNumber + 1 because Material UI requires starting page === 0
                pageNumber: paginationState.pageNumber + 1,
                rowCount: paginationState.rowCount,
                sortBy: subjectUnitIdentifierStringToEnum(sortState?.sortModel[0]?.field),
                sortOrder: sortState.sortModel.length > 0 ? (sortState.sortModel[0].sort === 'asc') : true,
            };
            const { data } = await getSubjectList(getSubjectListInput);
            if (data?.getSubjectList.subjects && data?.getSubjectList.subjects.length) {
                const subjectListWithId = data.getSubjectList.subjects.map(subject => {
                    const { idSubject, idSystemObject, SubjectName, UnitAbbreviation, IdentifierPublic } = subject;
                    return {
                        Name: SubjectName,
                        idSystemObject,
                        Identifier: IdentifierPublic,
                        idSubject,
                        Unit: UnitAbbreviation,
                        id: idSubject
                    };
                });
                setSubjectListState(subjectListWithId);
            } else {
                setSubjectListState([]);
            }
        } catch (error) {
            toast.error(`Error in fetching subjects. Message: ${error}`);
        }
        setLoading(false);
    };

    const onSearch = async (reset: boolean = false) => {
        if (reset) {
            await setSearchState({ ...searchState, text: '' });
            await setDropDownState({ ...dropDownState, value: 0 });
        }
        await setPaginationState({ ...paginationState, pageNumber: 0 });
        await setLoading(true);
        try {
            const getSubjectListInput = {
                search: reset ? '' : searchState.text,
                idUnit: reset ? 0 : dropDownState.value,
                pageNumber: 1,
                rowCount: paginationState.rowCount,
                sortBy: subjectUnitIdentifierStringToEnum(sortState?.sortModel[0]?.field),
                sortOrder: sortState.sortModel.length > 0 ? (sortState.sortModel[0].sort === 'asc') : true,
            };
            const { data } = await getSubjectList(getSubjectListInput);
            if (data?.getSubjectList.subjects && data?.getSubjectList.subjects.length) {
                const subjectListWithId = data.getSubjectList.subjects.map(subject => {
                    const { idSubject, idSystemObject, SubjectName, UnitAbbreviation, IdentifierPublic } = subject;
                    return {
                        Name: SubjectName,
                        idSystemObject,
                        Identifier: IdentifierPublic,
                        idSubject,
                        Unit: UnitAbbreviation,
                        id: idSubject
                    };
                });
                setSubjectListState(subjectListWithId);
            } else {
                setSubjectListState([]);
            }
        } catch (error) {
            toast.error(`Error in fetching subjects. Message: ${error}`);
        }
        setLoading(false);
    };

    const handlePaginationChange = async (params: GridPageChangeParams) => setPaginationState({ ...paginationState, pageNumber: params.page, rowCount: params.pageSize });

    const handleSortChange = (params: GridSortModelParams) => setSortState({ sortModel: params.sortModel });

    const handleDropDownChange = value => setDropDownState({ ...dropDownState, value });

    const handleSearchKeywordChange = value => setSearchState({ ...searchState, text: value });

    return (
        <Box className={classes.AdminViewContainer}>
            <Helmet>
                <title>Subjects Admin</title>
            </Helmet>
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} />
            </Box>
            <DataGridWithPagination
                loading={loading}
                PaginationSettings={paginationState}
                SortSettings={sortState}
                Search={searchState}
                DropDown={dropDownState}
                LinkBtn={{ link: resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTES_TYPE.CREATESUBJECT), btnText: 'Create' }}
                rows={subjectListState}
                columnHeader={columnHeader}
                handlePaginationChange={handlePaginationChange}
                handleDropDownChange={handleDropDownChange}
                handleSortChange={handleSortChange}
                handleSearchKeywordChange={handleSearchKeywordChange}
                handleSearch={onSearch}
                searchType='Subject'
            />
        </Box>
    );
}

const subjectUnitIdentifierStringToEnum = (col: string): eSubjectUnitIdentifierSortColumns => {
    switch (col) {
        case 'Unit': return eSubjectUnitIdentifierSortColumns.eUnitAbbreviation;
        case 'Name': return eSubjectUnitIdentifierSortColumns.eSubjectName;
        case 'Identifier': return eSubjectUnitIdentifierSortColumns.eIdentifierValue;
        default: return eSubjectUnitIdentifierSortColumns.eDefault;
    }
};

export default SubjectView;
