/**
 * NewTabLink
 *
 * Reusable internal link. Navigates in the same tab by default; pass `newTab`
 * to open in a new tab. Modifier-click (Ctrl/Cmd) and middle-click still open a
 * new tab natively because this renders a real anchor.
 */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { confirmLeaveEdit } from '../../store';

const useStyles = makeStyles(({ palette }) => ({
    link: {
        color: ({ color }: NewTabLinkProps) => color || palette.primary.dark,
        textDecoration: 'none'
    }
}));

interface NewTabLinkProps {
    color?: string;
    newTab?: boolean;
}

function NewTabLink(props: NewTabLinkProps & LinkProps): React.ReactElement {
    const classes = useStyles(props);
    const { newTab, target: targetProp, rel: relProp, children, ...linkProps } = props;

    const target = newTab ? '_blank' : (targetProp ?? '_self');
    const rel = newTab ? 'noopener noreferrer' : relProp;

    const customProps = {
        onClick: (event: React.MouseEvent) => {
            event.stopPropagation();
            // a plain click navigates in place; guard unsaved edits first. Modifier/
            // middle-clicks (and newTab) open a new tab and preserve the current view.
            const opensNewTab = newTab || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0;
            if (!opensNewTab && !confirmLeaveEdit())
                event.preventDefault();
        }
    };

    return (
        <Link
            className={classes.link}
            target={target}
            rel={rel}
            {...customProps}
            {...linkProps}
        >
            {children}
        </Link>
    );
}

export default NewTabLink;