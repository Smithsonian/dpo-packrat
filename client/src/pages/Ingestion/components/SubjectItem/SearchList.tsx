import React, { useState, useEffect } from 'react';
import { Box, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FieldType, LoadingButton } from '../../../../components';
import SubjectList from './SubjectList';
import { StateSubject } from '../../../../context';
import { useLazyQuery } from '@apollo/react-hooks';
import { QUERY_SEARCH_INGESTION_SUBJECTS } from '../../../../graphql';
import { parseSubjectToState } from '../../../../context/utils';
import { Subject } from '../../../../types/graphql';

const useStyles = makeStyles(({ palette }) => ({
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
        color: palette.background.paper
    }
}));

const mockSubjects: StateSubject[] = [{
    id: 1,
    arkId: '123de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '1 USNM RAD 125353: Geronimo 238'
},
{
    id: 2,
    arkId: '313958de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '2 USNM RAD 125353: Geronimo 238'
},
{
    id: 3,
    arkId: '31958de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '3 USNM RAD 125353: Geronimo 238'
}];

function SearchList(): React.ReactElement {
    const classes = useStyles();
    const [query, setQuery] = useState('');
    const [searchSubject, { data, called, loading, error }] = useLazyQuery(QUERY_SEARCH_INGESTION_SUBJECTS);

    const [subjects, setSubjects] = useState<StateSubject[]>([]);

    useEffect(() => {
        if (called && !loading && !error) {
            const { searchIngestionSubjects } = data;
            const { Subject: foundSubjects } = searchIngestionSubjects;
            // TODO: remove mock subjects after query integration
            const searchedSubjects = foundSubjects.map((subject: Subject) => parseSubjectToState(subject));
            setSubjects([...searchedSubjects, ...mockSubjects]);
        }
    }, [called, data, loading, error]);

    const onSearch = async () => {
        if (query === '') return;

        const variables = { input: { query } };
        searchSubject({ variables });
    };

    let content: React.ReactElement | null = null;

    if (subjects.length) {
        content = <SubjectList subjects={subjects} selected={false} emptyLabel='No subjects found' />;
    }

    return (
        <FieldType required={false} label='Search for Subject' marginTop={2}>
            <Box className={classes.container}>
                <TextField
                    className={classes.searchField}
                    InputLabelProps={{ shrink: false }}
                    onChange={({ target }) => setQuery(target.value)}
                />
                <LoadingButton
                    className={classes.searchButton}
                    variant='contained'
                    color='primary'
                    disableElevation
                    loading={false}
                    onClick={onSearch}
                >
                    Search

                </LoadingButton>
            </Box>
            <>
                {content}
            </>
        </FieldType>
    );
}

export default SearchList;