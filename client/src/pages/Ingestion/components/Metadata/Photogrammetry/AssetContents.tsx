import { Box, Typography, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../../components';
import { StateFolder, VocabularyOption } from '../../../../../store';

const useStyles = makeStyles(({ palette, typography }) => ({
    header: {
        display: 'flex',
        flex: 1,
        borderBottom: `1px solid ${palette.grey[400]}`,
        paddingBottom: 10
    },
    headerTitle: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: palette.primary.contrastText
    },
    emptyFolders: {
        marginTop: 10,
        color: palette.grey[600],
        textAlign: 'center'
    },
    contentText: {
        color: palette.primary.dark
    },
    select: {
        height: 30,
        width: '100%',
        padding: '0px 10px',
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
}));

interface AssetContentsProps {
    initialEntry: number | null;
    folders: StateFolder[];
    options: VocabularyOption[];
    onUpdate: (id: number, variantType: number) => void;
}

function AssetContents(props: AssetContentsProps): React.ReactElement {
    const { folders, options, initialEntry, onUpdate } = props;
    const classes = useStyles();

    return (
        <FieldType required renderLabel={false} marginTop={1.5}>
            <Box className={classes.header}>
                <Box className={classes.headerTitle}>
                    <Typography variant='body1'>Folder Name</Typography>
                </Box>
                <Box className={classes.headerTitle}>
                    <Typography variant='body1'>Variant Type</Typography>
                </Box>
            </Box>
            <Box display='flex' flex={1} flexDirection='column' mt={1}>
                {!folders.length && <Typography className={classes.emptyFolders} variant='caption'>No folders detected</Typography>}
                {folders.map(({ id, name, variantType }, index: number) => {
                    const update = ({ target }) => onUpdate(id, target.value);

                    return (
                        <Box key={index} display='flex' my={1}>
                            <Box display='flex' flex={3} maxWidth='60%'>
                                <Typography className={classes.contentText} variant='caption'>{name}</Typography>
                            </Box>
                            <Box display='flex' flex={2} alignItems='center' justifyContent='center'>
                                <Select
                                    value={variantType || initialEntry}
                                    className={classes.select}
                                    name='folders'
                                    onChange={update}
                                    disableUnderline
                                >
                                    {options.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                </Select>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </FieldType>
    );
}

export default AssetContents;
