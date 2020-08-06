import React, { useState } from 'react';
import { Box, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FieldType, LoadingButton } from '../../../../components';
import SubjectList from './SubjectList';
import { Subject } from '../../../../context';

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

const mockSubjects: Subject[] = [{
    arkId: '123de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '1 USNM RAD 125353: Geronimo 238'
},
{
    arkId: '313958de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '2 USNM RAD 125353: Geronimo 238'
},
{
    arkId: '31958de82-9664-4049-b5bb-746e2fbe229e',
    unit: 'NMNH',
    name: '3 USNM RAD 125353: Geronimo 238'
}];

function SearchList(): React.ReactElement {
    const classes = useStyles();
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const onSearch = () => {
        setSubjects(mockSubjects);
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