/**
 * IdentifierList
 *
 * This component renders identifier list used in photogrammetry metadata component.
 */
import { Box, Button, Checkbox, MenuItem, Select } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { FieldType } from '../../../../../components';
import { StateIdentifier, VocabularyOption } from '../../../../../store';

const useStyles = makeStyles(({ palette, typography, spacing, breakpoints }) => ({
    container: {
        marginTop: 20
    },
    assetIdentifier: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,
    },
    systemCreatedText: {
        marginLeft: spacing(2),
        fontStyle: 'italic',
        color: palette.primary.contrastText
    },
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
    addIdentifier: {
        height: 30,
        width: 80,
        fontSize: '0.8em',
        color: palette.background.paper,
    }
}));

interface IdentifierListProps {
    identifiers: StateIdentifier[]
    onAdd: (initialEntry: number | null) => void;
    onUpdate: (id: number, fieldName: string, fieldValue: number | string | boolean) => void;
    onRemove: (id: number) => void;
    identifierTypes: VocabularyOption[];
}

function IdentifierList(props: IdentifierListProps): React.ReactElement {
    const { identifiers, onAdd, onUpdate, identifierTypes, onRemove } = props;
    const classes = useStyles();

    return (
        <Box overflow='hidden'>
            <FieldType required={false} renderLabel={false} width='auto'>
                <React.Fragment>
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
                                paddingY={'10px'}
                            >
                                <Checkbox
                                    checked={selected}
                                    name='selected'
                                    color='primary'
                                    onChange={updateCheckbox}
                                />
                                <DebounceInput
                                    value={identifier}
                                    name='identifier'
                                    className={classes.identifierInput}
                                    onChange={update}
                                    debounceTimeout={500}
                                    placeholder='Add new identifer'
                                />
                                <Select
                                    value={identifierType}
                                    className={classes.identifierSelect}
                                    name='identifierType'
                                    onChange={update}
                                    disableUnderline
                                >
                                    {identifierTypes.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                                </Select>
                                <MdRemoveCircleOutline className={classes.identifierOption} onClick={remove} size={30} />
                            </Box>
                        );
                    })}
                    <Button
                        className={classes.addIdentifier}
                        disableElevation
                        color='primary'
                        variant='contained'
                        onClick={() => onAdd(identifierTypes[0].idVocabulary)}
                    >
                        Add
                    </Button>
                </React.Fragment>
            </FieldType>
        </Box>
    );
}

export default IdentifierList;