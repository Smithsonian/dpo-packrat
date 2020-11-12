/**
 * IdentifierList
 *
 * This component renders identifier list used in photogrammetry metadata component.
 */
import { Box, Button, Checkbox, MenuItem, Select, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { StateIdentifier, VocabularyOption } from '../../store';
import { sharedButtonProps, sharedLabelProps } from '../../utils/shared';
import FieldType from './FieldType';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    identifierInput: {
        width: '75%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        paddingBottom: 5,
        backgroundColor: 'transparent',
        fontSize: '0.9em',
        fontFamily: typography.fontFamily,
        borderBottom: `1px solid ${palette.grey[300]}`,
        '&:focus': {
            outline: 'none',
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    },
    identifierSelect: {
        minWidth: 180,
        padding: '0px 10px',
        marginLeft: 20,
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
        }
    },
    identifierOption: {
        marginLeft: 20,
        cursor: 'pointer'
    },
    header: {
        ...sharedLabelProps, fontSize: '0.9em'
    },
    addIdentifierButton: sharedButtonProps
}));

interface IdentifierListProps {
    identifiers: StateIdentifier[]
    onAdd: (initialEntry: number | null) => void;
    onUpdate: (id: number, fieldName: string, fieldValue: number | string | boolean) => void;
    onRemove: (id: number) => void;
    identifierTypes: VocabularyOption[];
    disabled?: boolean;
}

function IdentifierList(props: IdentifierListProps): React.ReactElement {
    const { identifiers, onAdd, onUpdate, identifierTypes, onRemove, disabled = false } = props;
    const classes = useStyles();

    return (
        <Box overflow='hidden'>
            <FieldType required={false} renderLabel={false} width='auto'>
                {!!identifiers.length && <Header />}
                {identifiers.map(({ id, selected, identifier, identifierType }, index) => {
                    const remove = () => onRemove(id);
                    const updateCheckbox = ({ target }) => onUpdate(id, target.name, target.checked);
                    const update = ({ target }) => onUpdate(id, target.name, target.value);

                    return (
                        <Box
                            key={index}
                            display='flex'
                            flexDirection='row'
                            alignItems='center'
                            paddingBottom='10px'
                        >
                            <Checkbox
                                checked={selected}
                                name='selected'
                                color='primary'
                                onChange={updateCheckbox}
                                disabled={disabled}
                            />
                            <DebounceInput
                                value={identifier}
                                name='identifier'
                                className={classes.identifierInput}
                                onChange={update}
                                debounceTimeout={500}
                                placeholder='Add new identifer'
                                disabled={disabled}
                            />
                            <Select
                                value={identifierType}
                                className={classes.identifierSelect}
                                name='identifierType'
                                onChange={update}
                                disableUnderline
                                disabled={disabled}
                            >
                                {identifierTypes.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
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
                    disabled={disabled}
                >
                    Add
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
                <Typography className={classes.header}>Identifer</Typography>
            </Box>
            <Box display='flex' style={{ width: 220 }}>
                <Typography className={classes.header}>Identifer Type</Typography>
            </Box>
        </Box>
    );
}

export default IdentifierList;