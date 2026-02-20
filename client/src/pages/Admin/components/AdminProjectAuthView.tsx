/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Box, Button, Select, MenuItem, Typography, IconButton, Switch, FormControlLabel } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import { useParams, useLocation, useNavigate } from 'react-router';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { useUserStore } from '../../../store';
import API from '../../../api';

const useStyles = makeStyles(({ typography }) => createStyles({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingLeft: '15px',
        margin: '0 auto'
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        width: '500px',
        backgroundColor: '#EFF2FC',
        borderRadius: '10px',
        border: '1px solid #B7D2E5CC',
        boxShadow: '0 0 0 5px #75B3DF',
        padding: '10px',
        marginTop: '15px',
        marginLeft: '5px'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        width: 'fit-content'
    },
    styledBtn: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    buttonGroup: {
        marginTop: '15px',
        columnGap: 30,
        display: 'flex'
    },
    userRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: '1px solid #D8E5EE'
    },
    select: {
        width: '60%',
        minWidth: 'fit-content',
        height: '24px',
        padding: '0px 5px',
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        color: 'black',
        borderRadius: 5,
        border: '1px solid rgb(118,118,118)',
        backgroundColor: 'white'
    },
    note: {
        marginTop: '8px',
        fontSize: '0.75rem',
        color: '#666',
        fontStyle: 'italic'
    }
}));

function AdminProjectAuthView(): React.ReactElement {
    const classes = useStyles();
    const navigate = useNavigate();
    const location = useLocation();
    const { idProject } = useParams();
    const { user } = useUserStore();
    const isAuthorized = user?.canAccessTools ?? false;

    const [projectName, setProjectName] = useState<string>('');
    const [isRestricted, setIsRestricted] = useState<boolean>(false);
    const [authorizedUsers, setAuthorizedUsers] = useState<{ idUser: number; Name: string; EmailAddress: string }[]>([]);
    const [allUsers, setAllUsers] = useState<{ idUser: number; Name: string; EmailAddress: string; Active: boolean }[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!idProject) return;

            const [projectResult, usersResult] = await Promise.all([
                API.getProjectAuth(Number(idProject)),
                API.getAuthUsers()
            ]);

            if (projectResult?.success && projectResult.data) {
                setProjectName(projectResult.data.Name);
                setIsRestricted(projectResult.data.isRestricted);
                setAuthorizedUsers(projectResult.data.authorizedUsers || []);
            } else {
                toast.error('Failed to load project authorization data');
            }

            if (usersResult?.success && usersResult.data) {
                setAllUsers(usersResult.data);
            }

            setLoading(false);
        };
        fetchData();
    }, [idProject]);

    const handleAddUser = () => {
        if (!selectedUserId) return;
        if (authorizedUsers.some(u => u.idUser === selectedUserId)) {
            toast.warn('User already authorized');
            return;
        }
        const user = allUsers.find(u => u.idUser === selectedUserId);
        if (user) {
            setAuthorizedUsers(prev => [...prev, { idUser: user.idUser, Name: user.Name, EmailAddress: user.EmailAddress }]);
            setSelectedUserId(0);
        }
    };

    const handleRemoveUser = (idUser: number) => {
        setAuthorizedUsers(prev => prev.filter(u => u.idUser !== idUser));
    };

    const handleSave = async () => {
        if (isRestricted && authorizedUsers.length === 0) {
            const confirmed = window.confirm('This project is restricted but has no authorized users. Only admins will be able to access it. Continue?');
            if (!confirmed) return;
        }

        const result = await API.setProjectAuth(
            Number(idProject),
            isRestricted,
            authorizedUsers.map(u => u.idUser)
        );

        if (result?.success) {
            toast.success('Project authorization updated');
            navigate('/admin/projects');
        } else {
            toast.error(`Failed to update: ${result?.message}`);
        }
    };

    if (!isAuthorized) {
        return <p>You are <b>Not Authorized</b> to view this page. Contact support.</p>;
    }

    if (loading) {
        return <Box className={classes.container}><Typography>Loading...</Typography></Box>;
    }

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Project Authorization</title>
            </Helmet>
            <Box className={classes.AdminBreadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} end={projectName} />
            </Box>
            <Box className={classes.formContainer}>
                <Typography variant='subtitle2' style={{ fontWeight: 600, color: '#3F536E', marginBottom: '8px' }}>
                    {projectName} - Authorization
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={isRestricted}
                            onChange={e => setIsRestricted(e.target.checked)}
                            color='primary'
                            size='small'
                        />
                    }
                    label={<Typography variant='caption' style={{ fontSize: '0.85rem' }}>Restricted Access</Typography>}
                />

                {isRestricted && (
                    <Box style={{ marginTop: '12px' }}>
                        <Typography variant='caption' style={{ fontWeight: 600, fontSize: '0.85rem', color: '#3F536E' }}>
                            Authorized Users
                        </Typography>

                        {authorizedUsers.length > 0 ? (
                            <Box style={{ marginTop: '4px', marginBottom: '8px' }}>
                                {authorizedUsers.map(u => (
                                    <Box key={u.idUser} className={classes.userRow}>
                                        <Typography variant='caption' style={{ fontSize: '0.8rem' }}>
                                            {u.Name} ({u.EmailAddress})
                                        </Typography>
                                        <IconButton size='small' onClick={() => handleRemoveUser(u.idUser)} aria-label='remove user'>
                                            <DeleteIcon fontSize='small' />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant='caption' style={{ display: 'block', color: '#999', margin: '4px 0 8px' }}>
                                No users authorized. Only admins can access this project.
                            </Typography>
                        )}

                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Select
                                value={selectedUserId}
                                className={classes.select}
                                disableUnderline
                                onChange={e => setSelectedUserId(Number(e.target.value))}
                                displayEmpty
                            >
                                <MenuItem value={0} disabled>(Select User)</MenuItem>
                                {allUsers
                                    .filter(u => u.Active && !authorizedUsers.some(a => a.idUser === u.idUser))
                                    .map(u => (
                                        <MenuItem key={u.idUser} value={u.idUser}>{u.Name} ({u.EmailAddress})</MenuItem>
                                    ))
                                }
                            </Select>
                            <Button size='small' variant='outlined' onClick={handleAddUser} disabled={!selectedUserId}>Add</Button>
                        </Box>
                    </Box>
                )}

                <Typography className={classes.note}>
                    Note: Changes to user authorization take effect on the user's next login.
                </Typography>
            </Box>

            <Box className={classes.buttonGroup}>
                <Button variant='contained' className={classes.styledBtn} onClick={handleSave} disableElevation>
                    Save
                </Button>
                <Button variant='contained' className={classes.styledBtn} onClick={() => navigate('/admin/projects')} disableElevation>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}

export default AdminProjectAuthView;
