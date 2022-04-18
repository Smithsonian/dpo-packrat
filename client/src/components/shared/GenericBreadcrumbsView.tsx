/**
 * BreadcrumbsView
 *
 * This is a reusable component which renders breadcrumbs.
 */
import { Breadcrumbs } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { Colors } from '../../theme';
import { Link } from 'react-router-dom';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { toTitleCase } from '../../constants/helperfunctions';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        color: palette.primary.dark
    },
    highlighted: {
        backgroundColor: fade(palette.primary.main, 0.8),
        color: palette.background.paper,
        padding: '2.5px 10px',
        borderRadius: 5
    },
    label: {
        fontSize: '0.8em'
    },
    selectIcon: {
        color: Colors.defaults.white,
        fontSize: '0.8em'
    },
    menuItem: {
        fontSize: '0.8em'
    }
}));

interface BreadcrumbsViewProps {
    items: string;
    highlighted?: boolean;
    end?: string | null;
}

function GenericBreadcrumbsView(props: BreadcrumbsViewProps): React.ReactElement {
    const { items, highlighted = false, end = null } = props;
    const classes = useStyles();
    if (!items || items.length === 0 || !items.includes('/')) return <React.Fragment />;
    const trimmedItems = items[items.length - 1] === '/' ? items.slice(0, items.length - 1) : items;
    const splitPathCrumbsArray = trimmedItems.split('/');
    const finalPathCrumbsArray = splitPathCrumbsArray.map(subPath => {
        return {
            subPath,
            fullPath: ''
        };
    });

    let currentFullPath = '';
    for (let i = 0; i < finalPathCrumbsArray.length; i++) {
        currentFullPath += `${finalPathCrumbsArray[i].subPath}/`;
        finalPathCrumbsArray[i].fullPath = currentFullPath;
    }

    return (
        <Breadcrumbs className={clsx(classes.container, highlighted && classes.highlighted)} separator={<ArrowRightIcon />}>
            {finalPathCrumbsArray.map((item, index) => {
                if (index === finalPathCrumbsArray.length - 1 && end) {
                    return null;
                }
                if (index === finalPathCrumbsArray.length - 1) {
                    return <div key={index}>{toTitleCase(item.subPath)}</div>;
                }
                return (
                    <Link style={{ textDecoration: 'none', color: 'rgb(0,0,150)' }} to={`/${item.fullPath}`} key={index}>
                        {toTitleCase(item.subPath)}
                    </Link>
                );
            })}
            {end && <div>{end}</div>}
        </Breadcrumbs>
    );
}

// takes in a string
// e.g. '/admin/user/create'
// each crumb shows the name of the crumb
// links to different one each time
// /admin, /admin/user, /admin/user/create
// creates link for everything but the very last one
// if an option end is included, that will guaranteed to be the final crumb

export default GenericBreadcrumbsView;
