import { Box, Button, Checkbox, MenuItem, Select } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { FieldType } from '../../../../../components';
import { StateIdentifier, VocabularyOption } from '../../../../../context';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
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
        fontSize: typography.body1.fontSize,
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
        border: `1px solid ${palette.primary.contrastText}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
    identifierOption: {
        marginLeft: 20,
        cursor: 'pointer'
    },
    addIdentifier: {
        color: palette.background.paper,
        width: 80
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
                <>
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
                                <MdRemoveCircleOutline className={classes.identifierOption} onClick={remove} size={35} />
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
                </>
            </FieldType>
        </Box>
    );
}

export default IdentifierList;