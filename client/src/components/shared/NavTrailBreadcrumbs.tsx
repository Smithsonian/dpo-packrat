/**
 * NavTrailBreadcrumbs
 *
 * Renders the navigation trail (the path of repository objects the user actually
 * visited) as clickable breadcrumbs. Clicking an earlier crumb truncates the trail
 * back to that point and navigates there in the same tab.
 */
import { Breadcrumbs, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useNavHistoryStore } from '../../store';
import { getTermForSystemObjectType } from '../../utils/repository';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        backgroundColor: fade(palette.primary.main, 0.8),
        color: palette.background.paper,
        padding: '2.5px 10px',
        borderRadius: 5
    },
    crumb: {
        fontSize: '0.7rem',
        color: 'white',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline'
        }
    },
    current: {
        fontSize: '0.7rem',
        color: 'white',
        fontWeight: 600,
        cursor: 'default'
    }
}));

function NavTrailBreadcrumbs(): React.ReactElement | null {
    const classes = useStyles();
    const navigate = useNavigate();
    const [trail, truncateTo] = useNavHistoryStore(state => [state.trail, state.truncateTo]);

    if (!trail.length) return null;

    return (
        <Breadcrumbs className={classes.container} separator={<MdNavigateNext color='inherit' size={20} />}>
            {trail.map((crumb, index) => {
                const label = crumb.label ?? `${getTermForSystemObjectType(crumb.objectType)} ${crumb.name}`;
                if (index === trail.length - 1)
                    return <Typography key={crumb.idSystemObject} className={classes.current}>{label}</Typography>;
                return (
                    <Typography
                        key={crumb.idSystemObject}
                        component='button'
                        className={classes.crumb}
                        onClick={() => { truncateTo(index); navigate(crumb.url); }}
                    >
                        {label}
                    </Typography>
                );
            })}
        </Breadcrumbs>
    );
}

export default NavTrailBreadcrumbs;
