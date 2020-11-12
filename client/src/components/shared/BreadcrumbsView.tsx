/**
 * BreadcrumbsView
 *
 * This is a reusable component which renders breadcrumbs.
 */
import { Breadcrumbs, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { RepositoryPath } from '../../store';
import { Colors } from '../../theme';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../utils/repository';
import NewTabLink from './NewTabLink';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        color: palette.primary.dark
    },
    highlighted: {
        backgroundColor: fade(palette.primary.main, 0.80),
        color: palette.background.paper,
        padding: '5px 10px',
        borderRadius: 5,
    },
    label: {
        [breakpoints.down('lg')]: {
            fontSize: '0.8em'
        }
    }
}));

interface BreadcrumbsViewProps {
    items: RepositoryPath[];
    highlighted?: boolean;
}

function BreadcrumbsView(props: BreadcrumbsViewProps): React.ReactElement {
    const { items, highlighted = false } = props;
    const classes = useStyles();

    const renderBreadcrumbs = ({ idSystemObject, name, objectType }: RepositoryPath, index: number) => (
        <NewTabLink key={index} to={getDetailsUrlForObject(idSystemObject)} color={Colors.defaults.white}>
            <Typography className={classes.label} color='inherit'>{getTermForSystemObjectType(objectType)} {name}</Typography>
        </NewTabLink>
    );

    return (
        <Breadcrumbs className={clsx(classes.container, highlighted && classes.highlighted)} separator={<MdNavigateNext color='inherit' size={20} />}>
            {items.map(renderBreadcrumbs)}
        </Breadcrumbs>
    );
}

export default BreadcrumbsView;