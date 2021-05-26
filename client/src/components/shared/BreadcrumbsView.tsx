/**
 * BreadcrumbsView
 *
 * This is a reusable component which renders breadcrumbs.
 */
import { Breadcrumbs, MenuItem, Select, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Colors, palette } from '../../theme';
import { RepositoryPath } from '../../types/graphql';
import { eSystemObjectType } from '../../types/server';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../utils/repository';
import NewTabLink from './NewTabLink';

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
    },
    link: {
        color: palette.primary.dark,
        textDecoration: 'none'
    }
}));

interface BreadcrumbsViewProps {
    items: RepositoryPath[][];
    highlighted?: boolean;
}

function BreadcrumbsView(props: BreadcrumbsViewProps): React.ReactElement {
    const { items, highlighted = false } = props;
    const classes = useStyles();

    const renderBreadcrumbs = (paths: RepositoryPath[], index: number): JSX.Element => <BreadcrumbItem key={index} paths={paths} />;
    return (
        <Breadcrumbs className={clsx(classes.container, highlighted && classes.highlighted)} separator={<MdNavigateNext color='inherit' size={20} />}>
            {items.map(renderBreadcrumbs)}
        </Breadcrumbs>
    );
}

const BreadcrumbSelect = withStyles(() => ({
    root: {
        color: Colors.defaults.white,
        fontSize: '0.8em'
    },
    select: {
        paddingRight: '0px !important'
    }
}))(Select);

interface BreadcrumbItemProps {
    paths: RepositoryPath[];
}

function BreadcrumbItem(props: BreadcrumbItemProps): React.ReactElement {
    const { paths } = props;
    const classes = useStyles();

    const getLabel = (objectType: eSystemObjectType, name: string) => `${getTermForSystemObjectType(objectType)} ${name}`;

    if (paths.length === 1) {
        return (
            <React.Fragment>
                {paths.map(({ idSystemObject, name, objectType }, index: number) => (
                    <NewTabLink key={index} to={getDetailsUrlForObject(idSystemObject)} color={Colors.defaults.white}>
                        <Typography className={classes.label}>{getLabel(objectType, name)}</Typography>
                    </NewTabLink>
                ))}
            </React.Fragment>
        );
    }

    const [{ objectType, name }] = paths;
    const renderValue = () => <Typography className={classes.selectIcon}>{getLabel(objectType, name)} (multiple)</Typography>;

    return (
        <BreadcrumbSelect value={paths[0].idSystemObject} renderValue={renderValue} IconComponent={() => null} disableUnderline>
            {paths.map(({ idSystemObject, name, objectType }, index: number) => (
                <MenuItem className={classes.menuItem} key={index} value={idSystemObject}>
                    <NewTabLink key={index} to={getDetailsUrlForObject(idSystemObject)} color={palette.primary.dark} className={classes.link}>
                        {getLabel(objectType, name)}
                    </NewTabLink>
                </MenuItem>
            ))}
        </BreadcrumbSelect>
    );
}

export default BreadcrumbsView;
