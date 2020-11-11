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
import { Link } from 'react-router-dom';
import { RepositoryPath } from '../../store';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../utils/repository';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        color: palette.primary.dark
    },
    highlighted: {
        backgroundColor: fade(palette.primary.main, 0.80),
        color: palette.background.paper,
        padding: '5px 10px',
        borderRadius: 5,
    },
    link: {
        color: palette.background.paper,
        textDecoration: 'none'
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
        <Link key={index} className={classes.link} to={getDetailsUrlForObject(idSystemObject)}>
            <Typography className={classes.label} color='inherit'>{getTermForSystemObjectType(objectType)} {name}</Typography>
        </Link>
    );

    return (
        <Breadcrumbs className={clsx(classes.container, highlighted && classes.highlighted)} separator={<MdNavigateNext color='inherit' size={20} />}>
            {items.map(renderBreadcrumbs)}
        </Breadcrumbs>
    );
}

export default BreadcrumbsView;