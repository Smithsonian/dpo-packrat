/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { GetProjectListDocument, GetProjectListResult } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import { useHistory } from 'react-router-dom';
import Clear from '@material-ui/icons/Clear';
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
    },
    AdminPageViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
        width: '1200px',
        margin: '0 auto'
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
    searchContainerLeft: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        columnGap: 10,
    },
    searchContainerRight: {
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
    }
});

function AdminProjectsList({ projects }): React.ReactElement {
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
            name: 'idProject',
            label: 'Action',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                customBodyRender(value) {
                    return <Link to={`/admin/projects/${value}`}>Edit</Link>
                },
                sort: false
            }
        }
    ];

    return (
        <Box className={classes.tableContainer}>
            <DataTable title='projects' data={projects} columns={columns} options={dataTableOptions} />
        </Box>
    );
}

function AdminProjectsFilter({ queryProjectsByFilter }: { queryProjectsByFilter: (newSearchText: string) => Promise<void> }): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const history = useHistory();
    const classes = useStyles();

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
    };

    const searchProjects = () => {
        queryProjectsByFilter(searchFilter);
    };

    return (
        <Box className={classes.filterContainer}>
            <Box className={classes.searchContainerLeft}>
                <label htmlFor='searchFilter' style={{ display: 'none' }}>Search Project</label>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Project'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                    InputProps={{
                        endAdornment: searchFilter.length ? (
                            <IconButton size='small' onClick={() => { setSearchFilter(''); queryProjectsByFilter(''); }}>
                                <Clear style={{ height: '16px' }} />
                            </IconButton>
                        ) : null,
                        style: { fontSize: '0.8rem' }
                    }}
                />
                <Button className={classes.styledButton} onClick={searchProjects} variant='contained' disableElevation>
                    Search
                </Button>
            </Box>
            <Box className={classes.searchContainerRight}>
                <Button className={classes.styledButton} onClick={() => history.push('/admin/projects/create')} variant='contained' disableElevation>Create</Button>
            </Box>
        </Box>
    );
}

function AdminProjectsView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const [projectList, setProjectList] = useState<GetProjectListResult['projects'] | []>([]);

    useEffect(() => {
        async function fetchInitialProjectList() {
            const initialProjectListQuery = await apolloClient.query({
                query: GetProjectListDocument,
                variables: {
                    input: {
                        search: ''
                    }
                },
                fetchPolicy: 'no-cache'
            });
            setProjectList(initialProjectListQuery?.data?.getProjectList?.projects);
        }

        fetchInitialProjectList();
    }, []);

    const queryProjectsByFilter = async newSearchText => {
        const newFilterQuery = await apolloClient.query({
            query: GetProjectListDocument,
            variables: {
                input: {
                    search: newSearchText
                }
            }
        });

        const {
            data: {
                getProjectList: { projects }
            }
        } = newFilterQuery;

        setProjectList(projects);
    };

    return (
        <React.Fragment>
            <Helmet>
                <title>Projects Admin</title>
            </Helmet>
            <Box className={classes.AdminPageViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                <AdminProjectsFilter queryProjectsByFilter={queryProjectsByFilter} />
                <AdminProjectsList projects={projectList} />
            </Box>
        </React.Fragment>
    );
}

export default AdminProjectsView;
