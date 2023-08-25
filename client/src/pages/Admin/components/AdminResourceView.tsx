/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { Box, } from '@material-ui/core'; //TextField, Button, IconButton
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { GetJobResourceList, GetJobResourceListInput, GetJobResourceListResult } from '../../../types/graphql'; //, GetUnitsFromNameSearchResult
import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
// import { useNavigate } from 'react-router-dom';
// import Clear from '@material-ui/icons/Clear';
// import DataTable from './shared/DataTable';
// import { DataTableOptions } from '../../../types/component';
// import clsx from 'clsx';

// enum ResourceTypeEnum {
//     COOK,
// }
// type ResourceType = {
//     type: ResourceTypeEnum,
//     name: string,
//     address: string,
//     port: number,
//     authName: string,
//     authPass?: string,
//     authKey: string,
//     canInspect: boolean,
//     canSceneGen: boolean,
//     canPhotogrammetry: boolean,
//     canBigFile: boolean,
// };

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
        columnGap: 10
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

function AdminJobResourceList({ resources }): React.ReactElement {
    const classes = useStyles();

    // const columns = [];
    console.log(resources);

    return (
        <Box className={classes.tableContainer}>
            <>List of job resources...</>
        </Box>
    );
}

function AdminJobResourceListView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const [resourceList, setResourceList] = useState<GetJobResourceListResult[]>([]);

    useEffect(() => {
        async function fetchInitialResourceList(input?: GetJobResourceListInput) {
            const initialResourceListQuery = await apolloClient.query({
                query: GetJobResourceList,
                variables: {
                    input: {
                        ...input ?? ''
                    }
                },
                fetchPolicy: 'no-cache'
            });
            console.log(initialResourceListQuery);
            setResourceList(initialResourceListQuery?.data?.getJobResourceLists?.resources);
        }

        fetchInitialResourceList();
    }, []);

    return (
        <React.Fragment>
            <Helmet>
                <title>Job Resources</title>
            </Helmet>
            <Box className={classes.AdminPageViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                <AdminJobResourceList resources={resourceList}></AdminJobResourceList>
            </Box>
        </React.Fragment>
    );
}
export default AdminJobResourceListView;
