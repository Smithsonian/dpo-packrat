/**
 * NewTabLink
 *
 * This is a reusable link component.
 */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

const useStyles = makeStyles(({ palette }) => ({
    link: {
        color: ({ color }: NewTabLinkProps) => color || palette.primary.dark,
        textDecoration: 'none'
    }
}));

interface NewTabLinkProps {
    color?: string;
}

function NewTabLink(props: NewTabLinkProps & LinkProps): React.ReactElement {
    const classes = useStyles(props);

    const customProps = {
        onClick: event => event.stopPropagation()
    };

    if (props.children) {
        return (
            <Link target='_blank' className={classes.link} {...customProps} {...props}>
                {props.children}
            </Link>
        );
    }

    return <Link target='_blank' className={classes.link} {...customProps} {...props} />;
}

export default NewTabLink;