/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Select, MenuItem, Typography, IconButton, Collapse } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import { toast } from 'react-toastify';
import { useUserStore } from '../../../../../store';
import API from '../../../../../api';

const useStyles = makeStyles(({ typography }) => createStyles({
    container: {
        marginTop: '8px',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        padding: '4px 0',
    },
    headerText: {
        fontWeight: 600,
        fontSize: '0.85rem',
        color: '#3F536E',
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
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
    },
    saveBtn: {
        height: '30px',
        width: '90px',
        color: 'white',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
    },
}));

type AuthUser = { idUser: number; Name: string; EmailAddress: string };
type AllUser = { idUser: number; Name: string; EmailAddress: string; Active: boolean };

interface UnitAuthorizedUsersProps {
    idUnit?: number;
}

function UnitAuthorizedUsers({ idUnit }: UnitAuthorizedUsersProps): React.ReactElement | null {
    const classes = useStyles();
    const { user } = useUserStore();
    const isAdmin = user?.isAdmin ?? false;

    const [open, setOpen] = useState<boolean>(false);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [authorizedUsers, setAuthorizedUsers] = useState<AuthUser[]>([]);
    const [savedUserIds, setSavedUserIds] = useState<number[]>([]);
    const [allUsers, setAllUsers] = useState<AllUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number>(0);
    const [saving, setSaving] = useState<boolean>(false);

    const isDirty = useCallback((): boolean => {
        const currentIds = authorizedUsers.map(u => u.idUser).sort();
        const saved = [...savedUserIds].sort();
        if (currentIds.length !== saved.length) return true;
        return currentIds.some((id, i) => id !== saved[i]);
    }, [authorizedUsers, savedUserIds]);

    useEffect(() => {
        if (!open || loaded || !idUnit) return;

        const fetchData = async () => {
            const [unitResult, usersResult] = await Promise.all([
                API.getUnitAuth(idUnit),
                API.getAuthUsers()
            ]);

            if (unitResult?.success && unitResult.data) {
                const users = unitResult.data.authorizedUsers || [];
                setAuthorizedUsers(users);
                setSavedUserIds(users.map((u: AuthUser) => u.idUser));
            } else {
                toast.error('Failed to load unit authorization data');
            }

            if (usersResult?.success && usersResult.data) {
                setAllUsers(usersResult.data);
            }

            setLoaded(true);
        };
        fetchData();
    }, [open, loaded, idUnit]);

    if (!isAdmin) return null;

    const handleToggle = () => setOpen(prev => !prev);

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
        if (!idUnit) return;
        setSaving(true);

        const result = await API.setUnitAuth(idUnit, authorizedUsers.map(u => u.idUser));

        if (result?.success) {
            toast.success('Unit authorization updated');
            setSavedUserIds(authorizedUsers.map(u => u.idUser));
        } else {
            toast.error(`Failed to update: ${result?.message}`);
        }

        setSaving(false);
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.headerRow} onClick={handleToggle}>
                <IconButton size='small'>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography className={classes.headerText}>Authorized Users</Typography>
            </Box>

            <Collapse in={open}>
                {!loaded ? (
                    <Typography style={{ padding: '8px 0', display: 'block', fontSize: '0.8rem', color: 'black' }}>Loading...</Typography>
                ) : (
                    <Box style={{ padding: '4px 0 8px 8px' }}>
                        {authorizedUsers.length > 0 ? (
                            <Box style={{ marginBottom: '8px' }}>
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
                                No users authorized for this unit.
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
                )}
            </Collapse>
        </Box>
    );
}

export default UnitAuthorizedUsers;
