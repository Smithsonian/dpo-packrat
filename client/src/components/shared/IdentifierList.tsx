/* eslint-disable react/jsx-max-props-per-line */

/**
 * IdentifierList
 *
 * This component renders identifier list used in photogrammetry metadata component.
 */
import { Box, Button, MenuItem, Select, Typography, Radio } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { StateIdentifier, VocabularyOption } from '../../store';
import { ViewableProps } from '../../types/repository';
import { sharedLabelProps } from '../../utils/shared';
import FieldType from './FieldType';
import { Progress } from '..';
import { Colors } from '../../theme';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    identifierInput: {
        width: '75%',
        border: 'none',
        padding: '5px 2px 5px 2px',
        backgroundColor: 'transparent',
        fontSize: '0.8em',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        borderBottom: `1px solid ${palette.grey[300]}`,
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    },
    identifierSelect: {
        width: 'fit-content',
        padding: 0,
        marginLeft: 20,
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        fontSize: '0.8em'
    },
    identifierOption: {
        marginLeft: 20,
        cursor: 'pointer'
    },
    empty: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        fontStyle: 'italic'
    },
    header: sharedLabelProps,
    addIdentifierButton: {
        height: 35,
        width: 80,
        outline: '0.5px hidden rgba(141, 171, 196, 0.4)',
        fontSize: typography.caption.fontSize,
        color: Colors.defaults.white,
        [breakpoints.down('lg')]: {
            height: 30
        }
    }
}));

interface IdentifierListProps extends ViewableProps {
    identifiers: StateIdentifier[];
    onAdd: (initialEntry: number | null, name?: string) => void;
    onUpdate: (id: number, fieldName: string, fieldValue: number | string | boolean) => void;
    onRemove: (idIdentifier: number, id: number) => void;
    identifierTypes: VocabularyOption[];
    subjectView?: boolean;
    onUpdateIdIdentifierPreferred?: (id: number) => void;
    loading?: boolean;
}

function IdentifierList(props: IdentifierListProps): React.ReactElement {
    const { identifiers, onAdd, onUpdate, identifierTypes, onRemove, viewMode = false, disabled = false, subjectView, onUpdateIdIdentifierPreferred, loading } = props;
    const classes = useStyles();
    const hasIdentifiers: boolean = !!identifiers.length;

    if (loading && subjectView) {
        return (
            <Box overflow='hidden'>
                <FieldType required={false} renderLabel={false} width='auto'>
                    <Progress />
                </FieldType>
            </Box>
        );
    }

    return (
        <Box overflow='hidden'>
            <FieldType required={false} renderLabel={false} width='auto' padding='10px'>
                {hasIdentifiers && <Header />}
                {!hasIdentifiers && viewMode && (
                    <Box pb={1}>
                        <Typography className={classes.empty}>No Identifiers</Typography>
                    </Box>
                )}
                {identifiers.map(({ id, identifier, identifierType, idIdentifier, preferred }, index) => {
                    const remove = () => onRemove(idIdentifier, id);
                    const update = ({ target }) => onUpdate(id, target.name, target.value);
                    const check = () => {
                        if (onUpdateIdIdentifierPreferred) onUpdateIdIdentifierPreferred(id);
                    };
                    return (
                        <Box key={index} display='flex' flexDirection='row' alignItems='center' paddingBottom='10px'>
                            {subjectView && <Radio inputProps={{ 'title': `radio${identifier}${idIdentifier}preferred`, 'aria-label': `radio${identifier}${idIdentifier}preferred` }} checked={preferred === true} name='selected' color='primary' disabled={disabled} onClick={check} size='small' />}
                            <DebounceInput
                                title={identifier}
                                value={identifier}
                                name='identifier'
                                className={classes.identifierInput}
                                onChange={update}
                                debounceTimeout={500}
                                placeholder='Add new identifer'
                                disabled={disabled}
                            />
                            <Select value={identifierType} className={classes.identifierSelect} name='identifierType' onChange={update} disableUnderline disabled={disabled} SelectDisplayProps={{ style: { paddingLeft: '10px' } }}>
                                {identifierTypes.map(({ idVocabulary, Term }, index) => (
                                    <MenuItem key={index} value={idVocabulary}>
                                        {Term}
                                    </MenuItem>
                                ))}
                            </Select>
                            <MdRemoveCircleOutline className={classes.identifierOption} onClick={remove} size={30} />
                        </Box>
                    );
                })}
                <Button
                    className={classes.addIdentifierButton}
                    disableElevation
                    color='primary'
                    variant='contained'
                    onClick={() => onAdd(identifierTypes[0].idVocabulary)}
                    style={{ width: 'fit-content' }}
                    disabled={disabled}
                >
                    New Identifier
                </Button>
            </FieldType>
        </Box>
    );
}

function Header(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box display='flex' flex={1} mb={1}>
            <Box display='flex' style={{ width: 40 }}></Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>Identifier</Typography>
            </Box>
            <Box display='flex' style={{ width: 140 }}>
                <Typography className={classes.header}>Identifier Type</Typography>
            </Box>
        </Box>
    );
}

export default IdentifierList;
