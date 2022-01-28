/**
 * SearchList
 *
 * This component renders search list used in SubjectItem component.
 */
import { useLazyQuery } from '@apollo/client';
import { Box, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import { FieldType, LoadingButton } from '../../../../components';
import { StateSubject, parseSubjectUnitIdentifierToState } from '../../../../store';
import { SearchIngestionSubjectsDocument } from '../../../../types/graphql';
import { SubjectUnitIdentifier } from '../../../../types/graphql';
import SubjectList from './SubjectList';
import { toast } from 'react-toastify';
import { actionOnKeyPress } from '../../../../utils/shared';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        paddingBottom: 10
    },
    searchField: {
        display: 'flex',
        flex: 1,
        marginRight: 20
    },
    searchButton: {
        height: 35,
        width: 60,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    }
}));

type SearchListProps = {
    EdanOnly?: boolean
};

function SearchList(props: SearchListProps): React.ReactElement {
    const { EdanOnly } = props;
    const classes = useStyles();
    const [query, setQuery] = useState('');
    const [searchSubject, { data, called, loading, error }] = useLazyQuery(SearchIngestionSubjectsDocument);

    const [subjects, setSubjects] = useState<StateSubject[]>([]);

    useEffect(() => {
        if (data && called && !loading && !error) {
            const { searchIngestionSubjects } = data;
            const { SubjectUnitIdentifier: foundSubjectUnitIdentifier } = searchIngestionSubjects;

            const searchedSubjectUnitIdentifier = foundSubjectUnitIdentifier.map((subjectUnitIdentifier: SubjectUnitIdentifier) => parseSubjectUnitIdentifierToState(subjectUnitIdentifier));
            setSubjects([...searchedSubjectUnitIdentifier]);
        }
    }, [called, data, loading, error]);

    const onSearch = (): void => {
        if (loading) return;

        const trimmedQuery = query.trim();

        if (trimmedQuery === '') {
            toast.warn('Search query should not be empty');
            return;
        }

        const variables: any = { input: { query: trimmedQuery } }; // eslint-disable-line @typescript-eslint/no-explicit-any
        variables.input.EdanOnly = EdanOnly;
        searchSubject({ variables });
    };

    let content: React.ReactNode = null;

    if (subjects.length) {
        content = <SubjectList subjects={subjects} selected={false} emptyLabel='No subjects found' />;
    }

    return (
        <FieldType required={false} label='Search for Subject' marginTop={2} padding='10px'>
            <Box className={classes.container}>
                <label htmlFor='searchSubjectFilter' style={{ display: 'none' }}>Search Subject</label>
                <TextField
                    className={classes.searchField}
                    InputLabelProps={{ shrink: false }}
                    onKeyDown={({ key }) => actionOnKeyPress(key, 'Enter', onSearch)}
                    onChange={({ target }) => setQuery(target.value)}
                    id='searchSubjectFilter'
                />
                <LoadingButton
                    className={classes.searchButton}
                    disableElevation
                    loaderSize={12}
                    loading={loading}
                    onClick={onSearch}
                    title='searchSubject'
                >
                    <IoIosSearch color='inherit' size={20} />
                </LoadingButton>
            </Box>
            <React.Fragment>
                {content}
            </React.Fragment>
        </FieldType>
    );
}

export default SearchList;