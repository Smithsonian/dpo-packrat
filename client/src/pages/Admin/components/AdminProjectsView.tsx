/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataGrid, Columns } from '@material-ui/data-grid';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useLocation } from 'react-router';
import { GetProjectListDocument, GetProjectListResult } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';

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
        background: '#0079C482',
        color: '#3F536E',
        marginBottom: '2%',
        width: 'fit-content'
    },
    styledButton: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
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

    const columnHeader: Columns = [
        {
            field: 'Name',
            headerName: 'Name',
            flex: 3,
            renderCell: params => (
                <Tooltip placement='left' title={`${params.getValue('Name')}`} arrow>
                    <div>{`${params.getValue('Name')}`}</div>
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
                <TextField className={classes.searchFilter} placeholder='Search Project' type='search' value={searchFilter} id='searchFilter' onChange={handleSearchFilterChange} />
                <Button className={classes.styledButton} style={{ right: '25px' }} onClick={searchProjects}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to='/admin/create/projects'>
                    <Button className={classes.styledButton}>Add Project</Button>
                </Link>
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
                }
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
