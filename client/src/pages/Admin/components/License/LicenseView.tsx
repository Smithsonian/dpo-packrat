/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// import { GridColumns } from '@material-ui/data-grid';
import { useLocation } from 'react-router';
import { GetLicenseListDocument, License } from '../../../../types/graphql';
import { apolloClient } from '../../../../graphql/index';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';
import { useLicenseStore } from '../../../../store';
import { Helmet } from 'react-helmet';
import { useHistory } from 'react-router-dom';
import Clear from '@material-ui/icons/Clear';
import DataTable from '../shared/DataTable';
import { DataTableOptions } from '../../../../types/component';
import clsx from 'clsx';

const useStyles = makeStyles(() => ({
    tableContainer: {
        marginTop: 15
    },
    AdminPageViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingLeft: '15px',
        paddingBottom: '15px',
        margin: '0 auto'
    },
    breadcrumbsContainer: {
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
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    searchFilter: {
        width: '250px'
    },
    evenTableRow: {
        backgroundColor: 'rgb(255, 255, 224)'
    },
    oddTableRow: {
        backgroundColor: 'white'
    },
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
}));

function LicenseList({ licenses }): React.ReactElement {
    const classes = useStyles();

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
            name: 'Name',
            label: 'Name',
            options: {
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'idLicense',
            label: 'Action',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                customBodyRender(value) {
                    return <Link to={`/admin/licenses/${value}`}>Edit</Link>;
                },
                sort: false
            }
        }
    ];

    return (
        <Box className={classes.tableContainer}>
            <DataTable title='licenses' columns={columns} data={licenses} options={dataTableOptions} />
        </Box>
    );
}

function SearchFilter({ queryByFilter }: { queryByFilter: (newSearchText: string) => Promise<void> }): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const history = useHistory();
    const classes = useStyles();

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
    };

    const search = () => queryByFilter(searchFilter);

    return (
        <Box className={classes.filterContainer}>
            <Box className={classes.searchFilterContainerLeft}>
                <label htmlFor='searchFilter' style={{ display: 'none' }}>Search License</label>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search License'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                    onKeyPress={e => {
                        if (e.key === 'Enter') search();
                    }}
                    InputProps={{
                        endAdornment: searchFilter.length ? (
                            <IconButton size='small' onClick={() => { setSearchFilter(''); queryByFilter(''); }}>
                                <Clear style={{ height: '16px' }} />
                            </IconButton>
                        ) : null,
                        style: { fontSize: '0.8rem' }
                    }}
                />
                <Button className={classes.styledButton} onClick={search} variant='contained' disableElevation>Search</Button>
            </Box>
            <Box className={classes.searchFilterContainerRight}>
                <Button className={classes.styledButton} onClick={() => history.push('/admin/licenses/create')} variant='contained' disableElevation>Create</Button>
            </Box>
        </Box>
    );
}

function LicenseView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const [licenseList, setLicenseList] = useState<License[]>([]);
    const getEntries = useLicenseStore(state => state.getEntries);

    useEffect(() => {
        const licenses = getEntries();
        setLicenseList(licenses);
    }, [getEntries]);

    const queryByFilter = async newSearchText => {
        const newFilterQuery = await apolloClient.query({
            query: GetLicenseListDocument,
            variables: {
                input: {
                    search: newSearchText
                }
            }
        });
        setLicenseList(newFilterQuery?.data?.getLicenseList?.Licenses);
    };

    return (
        <React.Fragment>
            <Helmet>
                <title>Licenses Admin</title>
            </Helmet>
            <Box className={classes.AdminPageViewContainer}>
                <Box className={classes.breadcrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                <SearchFilter queryByFilter={queryByFilter} />
                <LicenseList licenses={licenseList} />
            </Box>
        </React.Fragment>
    );
}
export default LicenseView;
