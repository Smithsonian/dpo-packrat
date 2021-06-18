/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import DataGridWithPagination, { Search, DropDown, PaginationSettings, SortSettings } from '../../../../components/shared/DataGridWithPagination';
import { Tooltip, Box } from '@material-ui/core';
import { Columns, PageChangeParams, SortModelParams } from '@material-ui/data-grid';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';
import { getUnitsList, getSubjectList } from '../../hooks/useAdminview';
import { resolveSubRoute, ADMIN_ROUTE, ADMIN_ROUTES_TYPE } from '../../../../constants/routes';
import { toast } from 'react-toastify';

const columnHeader: Columns = [
    {
        field: 'Unit',
        headerName: 'Unit',
        flex: 1,
        headerAlign: 'center',
        renderCell: params => (
            <Tooltip placement='left' title={`${params.getValue('Unit')}`} arrow>
                <div>{`${params.getValue('Unit')}`}</div>
            </Tooltip>
        )
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
        field: 'Identifier',
        headerName: 'Identifier',
        flex: 1.7,
        renderCell: params => <div>{`${params.getValue('Identifier')}`}</div>
    },
    {
        field: 'Action',
        headerName: 'Action',
        flex: 1,
        sortable: false,
        renderCell: params => <Link to={`/repository/details/${[params.row.idSystemObject]}`}>Edit</Link>
    }
];

const useStyles = makeStyles({
    AdminViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingLeft: '1%',
        width: '1200px',
        margin: '0 auto'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#0079C482',
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
        value: 2,
        options: [{ value: 2, label: '' }]
    });
    const [sortState, setSortState] = useState<SortSettings>({
        sortModel: []
    });
    const [loading, setLoading] = useState(false);
    const [subjectListState, setSubjectListState] = useState([]);

    useEffect(() => {
        const fetchUnitList = async () => {
            const { data } = await getUnitsList();
            if (data?.getUnitsFromNameSearch.Units && data?.getUnitsFromNameSearch.Units.length) {
                const fetchedUnitList = data?.getUnitsFromNameSearch.Units.slice();
                if (fetchedUnitList && fetchedUnitList.length) fetchedUnitList.sort((a, b) => a.Name.localeCompare(b.Name));
                const unitListOptions = fetchedUnitList.map(unit => {
                    return { value: unit.idUnit, label: unit.Name };
                });
                setDropDownState({ ...dropDownState, options: unitListOptions });
            }
        };
        fetchUnitList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchSubjectList();
    }, []);

    const fetchSubjectList = async () => {
        setLoading(true);
        const getSubjectListInput = {
            search: searchState.text,
            idUnit: dropDownState.value,
            pageNumber: paginationState.pageNumber,
            rowCount: paginationState.rowCount,
            sortBy: sortState.sortModel?.[0]?.field,
            sortOrder: sortState.sortModel?.[0]?.sort
        };
        const { data } = await getSubjectList(getSubjectListInput);
        if (data?.getSubjectList.subjects && data?.getSubjectList.subjects.length) {
            const subjectListWithId = data.getSubjectList.subjects.map(subject => {
                const { idSubject, idUnit, Name, IdentifierPreferred, SystemObject } = subject;
                const unitOption = dropDownState.options.find(option => option.value === idUnit);
                return {
                    Name,
                    idSystemObject: SystemObject.idSystemObject,
                    Identifier: IdentifierPreferred.IdentifierValue,
                    idSubject,
                    Unit: unitOption?.label,
                    id: idSubject
                };
            });
            setSubjectListState(subjectListWithId);
        } else {
            toast.error('Unable to fetch subjects. Please try again.');
        }
        setLoading(false);
    };

    const handlePaginationChange = async (params: PageChangeParams) => setPaginationState({ ...paginationState, pageNumber: params.page, rowCount: params.pageSize });

    const handleSortChange = (params: SortModelParams) => setSortState({ sortModel: params.sortModel });

    const handleDropDownChange = value => setDropDownState({ ...dropDownState, value });

    const handleSearchKeywordChange = value => setSearchState({ ...searchState, text: value });

    return (
        <Box className={classes.AdminViewContainer}>
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} />
            </Box>
            <DataGridWithPagination
                loading={loading}
                PaginationSettings={paginationState}
                SortSettings={sortState}
                Search={searchState}
                DropDown={dropDownState}
                ExtraBtn={{ link: resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTES_TYPE.CREATESUBJECT), btnText: 'Create' }}
                rows={subjectListState}
                columnHeader={columnHeader}
                handlePaginationChange={handlePaginationChange}
                handleDropDownChange={handleDropDownChange}
                handleSortChange={handleSortChange}
                handleSearchKeywordChange={handleSearchKeywordChange}
                handleSearch={fetchSubjectList}
            />
        </Box>
    );
}

export default SubjectView;
