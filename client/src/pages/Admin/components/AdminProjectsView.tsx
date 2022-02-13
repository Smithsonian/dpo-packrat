/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Tooltip, TextField, Button, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataGrid, GridColumns } from '@material-ui/data-grid';
import { useLocation } from 'react-router';
import { GetProjectListDocument, GetProjectListResult } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import { useHistory } from 'react-router-dom';
import Clear from '@material-ui/icons/Clear';

const useStyles = makeStyles({
    AdminListContainer: {
        marginTop: '2%',
        width: '450px',
        padding: '20px',
        height: 'calc(100% - 120px)',
        display: 'flex',
        border: '1px solid #B7D2E5CC',
        margin: '1px solid #B7D2E5CC',
        alignItems: 'center',
        backgroundColor: '#687DDB1A',
        borderRadius: '4px'
    },
    DataGridList: {
        letterSpacing: '1.7px',
        color: '#8DABC4',
        border: '1px solid #B7D2E5CC',
        borderRadius: '2px',
        backgroundColor: 'white'
    },
    AdminPageViewContainer: {
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
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '2%',
        width: 'fit-content'
    },
    styledButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    AdminSearchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        height: '70px',
        width: '600px',
        backgroundColor: '#FFFCD1',
        paddingLeft: '20px',
        paddingRight: '20px'
    },
    AdminUsersSearchFilterSettingsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%'
    },
    AdminUsersSearchFilterSettingsContainer2: {
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
        width: '350px'
    }
});

function AdminProjectsList({ projects }): React.ReactElement {
    const classes = useStyles();
    const projectsWithId = projects.map(project => {
        const { idProject, Name, SystemObject } = project;
        const { idSystemObject } = SystemObject;
        return {
            id: idProject,
            Name,
            idSystemObject
        };
    });

    const columnHeader: GridColumns = [
        {
            field: 'Name',
            headerName: 'Name',
            flex: 3,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.row.Name}`} arrow>
                    <div>{`${params.row.Name}`}</div>
                </Tooltip>
            )
        },
        {
            field: 'Action',
            headerName: 'Action',
            flex: 1,
            sortable: false,
            renderCell: params => (
                <Link to={`/repository/details/${[params.row.idSystemObject]}`} target='_blank'>
                    Edit
                </Link>
            )
        }
    ];

    return (
        <Box className={classes.AdminListContainer}>
            <DataGrid
                className={classes.DataGridList}
                rows={projectsWithId}
                columns={columnHeader}
                rowHeight={55}
                scrollbarSize={5}
                density='compact'
                disableSelectionOnClick
                hideFooter
            />
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
        <Box className={classes.AdminSearchFilterContainer}>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer}>
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
                        ) : null
                    }}
                />
                <Button className={classes.styledButton} style={{ right: '25px' }} onClick={searchProjects}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Button className={classes.styledButton} onClick={() => history.push('/admin/projects/create')}>Create</Button>
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
