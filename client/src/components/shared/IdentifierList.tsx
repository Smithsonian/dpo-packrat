/* eslint-disable react/jsx-max-props-per-line */

/**
 * IdentifierList
 *
 * This component renders identifier list used in photogrammetry metadata component.
 */
import { Box, Button /*, Checkbox*/, MenuItem, Select, Typography /*, Radio */ } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { StateIdentifier, VocabularyOption } from '../../store';
import { ViewableProps } from '../../types/repository';
import { sharedButtonProps, sharedLabelProps } from '../../utils/shared';
import FieldType from './FieldType';

/*
    TODO:
        fix the font of the buttons on New Identifier to be consistent
        when an identifier is removed in details view, make sure to refetch request so that the warning message disappears
        keep error message in the same line as the update button and italicize the message
*/
const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    identifierInput: {
        width: '75%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        paddingBottom: 5,
        backgroundColor: 'transparent',
        fontSize: '0.8em',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        borderBottom: `1px solid ${palette.grey[300]}`,
        '&:focus': {
            outline: 'none'
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    },
    identifierSelect: {
        width: 'fit-content',
        padding: '0px 10px',
        marginLeft: 20,
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em'
        }
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
    addIdentifierButton: sharedButtonProps
}));

interface IdentifierListProps extends ViewableProps {
    identifiers: StateIdentifier[];
    onAdd: (initialEntry: number | null, name?: string) => void;
    onUpdate: (id: number, fieldName: string, fieldValue: number | string | boolean) => void;
    onRemove: (idIdentifier: number, id: number) => void;
    identifierTypes: VocabularyOption[];
    subjectView?: boolean;
    selectedIdentifier?: StateIdentifier;
}

function IdentifierList(props: IdentifierListProps): React.ReactElement {
    const { identifiers, onAdd, onUpdate, identifierTypes, onRemove, viewMode = false, disabled = false } = props;
    const classes = useStyles();

    const hasIdentifiers: boolean = !!identifiers.length;
    return (
        <Box overflow='hidden'>
            <FieldType required={false} renderLabel={false} width='auto'>
                {hasIdentifiers && <Header />}
                {!hasIdentifiers && viewMode && (
                    <Box pb={1}>
                        <Typography className={classes.empty}>No Identifiers</Typography>
                    </Box>
                )}
                {identifiers.map(({ id /*, selected*/, identifier, identifierType, idIdentifier }, index) => {
                    const remove = () => onRemove(idIdentifier, id);
                    // const updateCheckbox = ({ target }) => onUpdate(id, target.name, target.checked);
                    const update = ({ target }) => onUpdate(id, target.name, target.value);

                    return (
                        <Box key={index} display='flex' flexDirection='row' alignItems='center' paddingBottom='10px'>
                            {/* <Checkbox checked={selected} name='selected' color='primary' onChange={updateCheckbox} disabled={disabled} /> */}
                            {/* <Radio checked={} onChange/> */}
                            <DebounceInput
                                value={identifier}
                                name='identifier'
                                className={classes.identifierInput}
                                onChange={update}
                                debounceTimeout={500}
                                placeholder='Add new identifer'
                                disabled={disabled}
                            />
                            <Select value={identifierType} className={classes.identifierSelect} name='identifierType' onChange={update} disableUnderline disabled={disabled}>
                                {identifierTypes.map(({ idVocabulary, Term }, index) => (
                                    <MenuItem key={index} value={idVocabulary}>
                                        {Term}
                                    </MenuItem>
                                ))}
                            </Select>
                            <MdRemoveCircleOutline className={classes.identifierOption} onClick={remove} size={'30px'} />
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
                <Typography className={classes.header}>Identifer</Typography>
            </Box>
            <Box display='flex' style={{ width: 140 }}>
                <Typography className={classes.header}>Identifer Type</Typography>
            </Box>
        </Box>
    );
}

export default IdentifierList;
