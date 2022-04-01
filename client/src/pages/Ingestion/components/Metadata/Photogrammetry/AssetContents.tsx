/**
 * AssetContents
 *
 * This component renders the folder type selector for contents present in
 * the uploaded assets
 */
import { Box, MenuItem, Select, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { AiFillFolder } from 'react-icons/ai';
import { StateFolder, VocabularyOption } from '../../../../../store';
import { palette } from '../../../../../theme';
import { ViewableProps } from '../../../../../types/repository';

export const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    emptyFolders: {
        margin: '10px 0px',
        color: palette.grey[600],
        textAlign: 'center'
    },
    select: {
        height: 24,
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        width: '150px',
        fontSize: '0.8rem',
        [breakpoints.down('lg')]: {
            width: '130px'
        }
    },
    tableContainer: {
        backgroundColor: 'rgb(236, 245, 253)',
        padding: '0px 2px 11px 2px',
        width: 380,
        height: 'fit-content',
        '& .MuiTableRow-head': {
        }
    },
    paddedCell: {
        padding: '1px 10px',
        border: 'none'
    }
}));

interface AssetContentsProps extends ViewableProps {
    initialEntry: number | null;
    folders: StateFolder[];
    options: VocabularyOption[];
    onUpdate: (id: number, variantType: number) => void;
}

function AssetContents(props: AssetContentsProps): React.ReactElement {
    const { folders, options, initialEntry, onUpdate, disabled = false } = props;
    const classes = useStyles();
    return (
        <>
            <EmptyContent label='folders' isEmpty={!folders.length} />
            <TableContainer component={Paper} className={classes.tableContainer} elevation={0}>
                <Table>
                    <TableHead style={{ borderBottom: '2px solid #D8E5EE' }}>
                        <TableRow >
                            <TableCell align='center' style={{ paddingBottom: 0 }}>
                                <Typography style={{ alignItems: 'center', color: palette.primary.dark }} variant='caption'>
                                    Folder Name
                                </Typography>
                            </TableCell>
                            <TableCell align='center' style={{ paddingBottom: 0 }}>
                                <Typography style={{ alignItems: 'center', color: palette.primary.dark }} variant='caption'>
                                    Variant Type
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {folders.map(({ id, name, variantType }: StateFolder, index: number) => {
                            const update = ({ target }) => onUpdate(id, target.value);

                            return (
                                <TableRow key={index}>
                                    <TableCell className={classes.paddedCell}>
                                        <Box display='flex' alignItems='center'>
                                            <Box paddingRight='5px'>
                                                <AiFillFolder color={palette.primary.contrastText} size={20} />
                                            </Box>
                                            <Typography style={{ color: palette.primary.dark, wordBreak: 'break-word' }} variant='caption'>{name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell className={classes.paddedCell}>
                                        <Select
                                            disabled={disabled}
                                            value={variantType || initialEntry}
                                            name={name}
                                            onChange={update}
                                            disableUnderline
                                            className={classes.select}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', paddingRight: '10px', borderRadius: '5px' } }}
                                        >
                                            {options.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}

interface EmptyContentProps {
    isEmpty: boolean;
    label: string;
}

export function EmptyContent(props: EmptyContentProps): React.ReactElement {
    const { isEmpty, label } = props;
    const classes = useStyles();

    if (!isEmpty) {
        return <React.Fragment />;
    }

    return <Typography className={classes.emptyFolders} variant='caption'>No {label} detected</Typography>;
}

export default AssetContents;