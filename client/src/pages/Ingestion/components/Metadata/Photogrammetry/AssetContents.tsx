import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../../components';
import SelectField from './SelectField';
import { StateFolder, VocabularyOption } from '../../../../../context';

const useStyles = makeStyles(({ palette }) => ({
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
    }
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
            <Box display='flex' flex={1} flexDirection='column'>
                {!folders.length && <Typography className={classes.emptyFolders} variant='caption'>No folders detected</Typography>}
                {folders.map(({ id, name, variantType }) => {
                    const update = ({ target }) => onUpdate(id, target.value);

                    return (
                        <SelectField
                            key={id}
                            required
                            label={name}
                            width='96%'
                            value={variantType || initialEntry}
                            name='folders'
                            onChange={update}
                            options={options}
                        />
                    );
                })}
            </Box>
        </FieldType>
    );
}

export default AssetContents;
