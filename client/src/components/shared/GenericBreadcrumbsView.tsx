/**
 * BreadcrumbsView
 *
 * This is a reusable component which renders breadcrumbs.
 */
import { Breadcrumbs } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Colors } from '../../theme';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
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
        [breakpoints.down('lg')]: {
            fontSize: '0.8em'
        }
    },
    selectIcon: {
        color: Colors.defaults.white,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em'
        }
    },
    menuItem: {
        fontSize: '0.8em'
    }
}));

interface BreadcrumbsViewProps {
    items: string;
    highlighted?: boolean;
}

function GenericBreadcrumbsView(props: BreadcrumbsViewProps): React.ReactElement {
    const { items, highlighted = false } = props;
    const classes = useStyles();

    let splitPathCrumbsArray = items.split('/');
    let finalPathCrumbsArray = splitPathCrumbsArray.map(subPath => {
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

    console.log(finalPathCrumbsArray);
    return (
        <Breadcrumbs className={clsx(classes.container, highlighted && classes.highlighted)} separator={<MdNavigateNext color='inherit' size={20} />}>
            {finalPathCrumbsArray.map((item, index) => {
                return (
                    <Link to={item.fullPath} key={index}>
                        {item.subPath}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
}

// takes in a string
// e.g. '/admin/user/create'
// each crumb shows the name of the crumb
// links to different one each time
// /admin, /admin/user, /admin/user/create
// creates link for everything but the very last one

export default GenericBreadcrumbsView;
