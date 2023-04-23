// element for holding auditing, verification, and outward facing reports/utils
import { Box, Container, Typography } from '@material-ui/core';
import { fade, makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';

// define the CSS styles we're going to use
const useStyles = makeStyles(({ palette, breakpoints }) => createStyles({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: palette.primary.light,
        zIndex: 10
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    loginFormContainer: {
        background: palette.background.paper,
        width: '25vw',
        borderRadius: 5,
        padding: 40,
        marginBottom: 20,
        boxShadow: `0px 1px 4px ${fade(palette.primary.dark, 0.2)}`,
        [breakpoints.down('md')]: {
            width: '30vw'
        },
        [breakpoints.down('sm')]: {
            width: '45vw'
        }
    },
    title: {
        fontWeight: 400,
        color: 'black',
        textAlign: 'center',
        marginBottom: 5
    },
    subtitle: {
        color: palette.primary.dark,
        fontWeight: 400,
        textAlign: 'center'
    }
}));

function Audit(): React.ReactElement {
    const classes = useStyles();

    const [verifierType, setVerifierType] = useState('edan');
    // const [verifierData, setVerifierData] = useState({});

    useEffect(() => {
        fetch('http://localhost:4000/verifier/edan?limit=2')
        // fetch('https://jsonplaceholder.typicode.com/posts')
            .then(response => response.json())
            .then(json => {
                const data = JSON.parse(json.data);
                console.log(json);
                console.log(data);
            })
            .catch((err) => {
                console.error(err);
            });
    },[verifierType]);

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Container className={classes.loginFormContainer}>
                    <Typography className={classes.title} variant='h4'>
                        Packrat
                    </Typography>
                    <Typography className={classes.subtitle} variant='body1'>
                        Auditing (coming soon...)
                    </Typography>
                    <div>
                        <button onClick={() => setVerifierType('edan')}>Refresh</button>
                    </div>
                </Container>
            </Box>
        </Box>
    );
}

export default Audit;
