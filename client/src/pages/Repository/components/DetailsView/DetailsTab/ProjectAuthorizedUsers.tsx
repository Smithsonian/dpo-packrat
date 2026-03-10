/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Select, MenuItem, Typography, Switch, FormControlLabel } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { toast } from 'react-toastify';
import { useUserStore } from '../../../../../store';
import API from '../../../../../api';

const useStyles = makeStyles(({ typography }) => createStyles({
    container: {
        padding: '8px',
        backgroundColor: 'rgb(236, 245, 253)',
    },
    sectionTitle: {
        fontWeight: 600,
        fontSize: '0.9rem',
        color: 'black',
        marginBottom: '4px',
    },
    description: {
        fontSize: '0.8rem',
        color: '#555',
        marginBottom: '12px',
    },
    userRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: '1px solid #D8E5EE',
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
        backgroundColor: 'white',
    },
    note: {
        marginTop: '8px',
        fontSize: '0.75rem',
        color: '#666',
        fontStyle: 'italic',
    },
    addBtn: {
        height: '30px',
        color: 'white',
    },
    saveBtn: {
        height: '30px',
        width: '90px',
        color: 'white',
    },
    restrictedBanner: {
        marginBottom: '12px',
    },
}));

type AuthUser = { idUser: number; Name: string; EmailAddress: string };
type AllUser = { idUser: number; Name: string; EmailAddress: string; Active: boolean };

interface ProjectAuthorizedUsersProps {
    idProject?: number;
}

function ProjectAuthorizedUsers({ idProject }: ProjectAuthorizedUsersProps): React.ReactElement | null {
    const classes = useStyles();
    const { user } = useUserStore();
    const isAdmin = user?.isAdmin ?? false;

    const [loaded, setLoaded] = useState<boolean>(false);
    const [isRestricted, setIsRestricted] = useState<boolean>(false);
    const [savedIsRestricted, setSavedIsRestricted] = useState<boolean>(false);
    const [authorizedUsers, setAuthorizedUsers] = useState<AuthUser[]>([]);
    const [savedUserIds, setSavedUserIds] = useState<number[]>([]);
    const [allUsers, setAllUsers] = useState<AllUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number>(0);
    const [saving, setSaving] = useState<boolean>(false);

    const isDirty = useCallback((): boolean => {
        if (isRestricted !== savedIsRestricted) return true;
        const currentIds = authorizedUsers.map(u => u.idUser).sort();
        const saved = [...savedUserIds].sort();
        if (currentIds.length !== saved.length) return true;
        return currentIds.some((id, i) => id !== saved[i]);
    }, [authorizedUsers, savedUserIds, isRestricted, savedIsRestricted]);

    useEffect(() => {
        if (loaded || !idProject || !isAdmin) return;

        const fetchData = async () => {
            const [projectResult, usersResult] = await Promise.all([
                API.getProjectAuth(idProject),
                API.getAuthUsers()
            ]);

            if (projectResult?.success && projectResult.data) {
                const users = projectResult.data.authorizedUsers || [];
                setIsRestricted(Boolean(projectResult.data.isRestricted));
                setSavedIsRestricted(Boolean(projectResult.data.isRestricted));
                setAuthorizedUsers(users);
                setSavedUserIds(users.map((u: AuthUser) => u.idUser));
            } else {
                toast.error('Failed to load project authorization data');
            }

            if (usersResult?.success && usersResult.data) {
                setAllUsers(usersResult.data);
            }

            setLoaded(true);
        };
        fetchData();
    }, [loaded, idProject, isAdmin]);

    if (!isAdmin) {
        return (
            <Box className={classes.container}>
                <Typography style={{ fontSize: '0.85rem', color: 'black' }}>Admin access required to manage authorization.</Typography>
            </Box>
        );
    }

    if (!loaded) {
        return (
            <Box className={classes.container}>
                <Typography style={{ fontSize: '0.8rem', color: 'black' }}>Loading...</Typography>
            </Box>
        );
    }

    const handleAddUser = () => {
        if (!selectedUserId) return;
        if (authorizedUsers.some(u => u.idUser === selectedUserId)) {
            toast.warn('User already authorized');
            return;
        }
        const found = allUsers.find(u => u.idUser === selectedUserId);
        if (found) {
            setAuthorizedUsers(prev => [...prev, { idUser: found.idUser, Name: found.Name, EmailAddress: found.EmailAddress }]);
            setSelectedUserId(0);
        }
    };

    const handleRemoveUser = (idUser: number) => {
        setAuthorizedUsers(prev => prev.filter(u => u.idUser !== idUser));
    };

    const handleSave = async () => {
        if (!idProject) return;

        if (isRestricted && authorizedUsers.length === 0) {
            const confirmed = window.confirm('This project is restricted but has no authorized users. Only admins will be able to access it. Continue?');
            if (!confirmed) return;
        }

        setSaving(true);

        const result = await API.setProjectAuth(
            idProject,
            isRestricted,
            authorizedUsers.map(u => u.idUser)
        );

        if (result?.success) {
            toast.success('Project authorization updated');
            setSavedIsRestricted(isRestricted);
            setSavedUserIds(authorizedUsers.map(u => u.idUser));
        } else {
            toast.error(`Failed to update: ${result?.message}`);
        }

        setSaving(false);
    };

    return (
        <Box className={classes.container}>
            <Typography className={classes.sectionTitle}>Project Authorization</Typography>
            <Typography className={classes.description}>
                When restricted access is enabled, only listed users and admins can view this project
                and its contents. Other users will see an &quot;Access Denied&quot; message. Changes take
                effect on each user&apos;s next login.
            </Typography>

            {isRestricted && (
                <Alert severity='info' className={classes.restrictedBanner}>
                    This project is currently restricted. Only authorized users and admins can access it.
                </Alert>
            )}

            <FormControlLabel
                control={
                    <Switch
                        checked={isRestricted}
                        onChange={e => setIsRestricted(e.target.checked)}
                        color='primary'
                        size='small'
                    />
                }
                label={<Typography style={{ fontSize: '0.85rem', color: 'black' }}>Restricted Access</Typography>}
            />

            {isRestricted && (
                <Box style={{ marginTop: '8px' }}>
                    <Typography style={{ fontWeight: 600, fontSize: '0.85rem', color: 'black' }}>
                        Authorized Users
                    </Typography>

                    {authorizedUsers.length > 0 ? (
                        <Box style={{ marginTop: '4px', marginBottom: '8px' }}>
                            {authorizedUsers.map(u => (
                                <Box key={u.idUser} className={classes.userRow}>
                                    <Typography style={{ fontSize: '0.8rem', color: 'black' }}>
                                        {u.Name} ({u.EmailAddress})
                                    </Typography>
                                    <IconButton size='small' onClick={() => handleRemoveUser(u.idUser)} aria-label='remove user'>
                                        <DeleteIcon fontSize='small' />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography style={{ display: 'block', color: '#999', fontSize: '0.8rem', margin: '4px 0 8px' }}>
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
                        <Button size='small' variant='contained' color='primary' className={classes.addBtn} onClick={handleAddUser} disabled={!selectedUserId} disableElevation>Add</Button>
                    </Box>
                </Box>
            )}

            <Typography className={classes.note}>
                Note: Changes to user authorization take effect on the user&apos;s next login.
            </Typography>

            {isDirty() && (
                <Box style={{ marginTop: '10px' }}>
                    <Button
                        variant='contained'
                        color='primary'
                        className={classes.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                        disableElevation
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default ProjectAuthorizedUsers;
