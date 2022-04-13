import { Box, Checkbox, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import lodash from 'lodash';
import React from 'react';
import { StateIdentifier, useVocabularyStore } from '../../store';
import { eVocabularySetID } from '@dpo-packrat/common';
import FieldType from './FieldType';
import IdentifierList from './IdentifierList';

const useStyles = makeStyles(({ palette, spacing }) => ({
    assetIdentifier: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10
    },
    systemCreatedText: {
        marginLeft: spacing(2),
        fontStyle: 'italic',
        color: palette.primary.dark,
        backgroundColor: 'rgb(236, 245, 253)'
    },
    addIdentifierButton: {
        height: 30,
        width: 80,
        fontSize: '0.8em',
        color: '#FFFFFF',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    }
}));

interface AssetIdentifiersProps {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    onSystemCreatedChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onAddIdentifer: (identifiers: StateIdentifier[]) => void;
    onUpdateIdentifer: (identifiers: StateIdentifier[]) => void;
    onRemoveIdentifer: (identifiers: StateIdentifier[]) => void;
    subjectView?: boolean;
    onUpdateIdIdentifierPreferred?: (id: number) => void;
    identifierName: string;
}

function AssetIdentifiers(props: AssetIdentifiersProps): React.ReactElement {
    const { systemCreated, identifiers, onSystemCreatedChange, onAddIdentifer, onUpdateIdentifer, onRemoveIdentifer,
        subjectView, onUpdateIdIdentifierPreferred, identifierName } = props;
    const classes = useStyles();
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    const addIdentifer = (initialEntry: number | null) => {
        const newIdentifier: StateIdentifier = {
            id: identifiers.length + 1,
            identifier: '',
            identifierType: getInitialEntry(eVocabularySetID.eIdentifierIdentifierType) || initialEntry,
            idIdentifier: 0,
            preferred: undefined
        };

        const updatedIdentifiers = lodash.concat(identifiers, [newIdentifier]);
        onAddIdentifer(updatedIdentifiers);
    };

    const removeIdentifier = (_idIdentifier: number, id: number) => {
        const updatedIdentifiers = lodash.filter(identifiers, identifier => identifier.id !== id);
        onRemoveIdentifer(updatedIdentifiers);
    };

    const updateIdentifierFields = (id: number, name: string, value: string | number | boolean) => {
        const updatedIdentifiers = identifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value
                };
            }
            return identifier;
        });
        onUpdateIdentifer(updatedIdentifiers);
    };

    const label: string = (identifierName ? identifierName : 'Asset') + ' Identifier(s)';
    return (
        <Box marginBottom='10px'>
            <FieldType required label={label} padding='10px'>
                <Box display='flex' justifyContent='space-between'>
                    <Box className={classes.assetIdentifier}>
                        <label htmlFor='systemCreated' style={{ display: 'none' }}>System Created Identifier</label>
                        <Checkbox
                            id='systemCreated'
                            name='systemCreated'
                            checked={systemCreated}
                            color='primary'
                            onChange={onSystemCreatedChange}
                        />
                        <Typography className={classes.systemCreatedText} variant='body1'>
                            System will create an identifier
                        </Typography>
                    </Box>
                    {!identifiers.length && (
                        <Button
                            className={classes.addIdentifierButton}
                            variant='contained'
                            color='primary'
                            disableElevation
                            onClick={() => {
                                addIdentifer(getEntries(eVocabularySetID.eIdentifierIdentifierType)[0].idVocabulary);
                            }}
                        >
                            Add
                        </Button>
                    )}
                </Box>
                {identifiers.length > 0 && (
                    <IdentifierList
                        identifiers={identifiers}
                        identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                        onAdd={addIdentifer}
                        onRemove={removeIdentifier}
                        onUpdate={updateIdentifierFields}
                        subjectView={subjectView}
                        onUpdateIdIdentifierPreferred={onUpdateIdIdentifierPreferred}
                    />
                )}
            </FieldType>
        </Box>
    );
}

export default AssetIdentifiers;
