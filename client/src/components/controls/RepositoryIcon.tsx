/**
 * RepositoryIcon
 *
 * This component renders the icons for the repository tree view item.
 */
import React from 'react';
import { eSystemObjectType } from '../../types/server';
import { getTermForSystemObjectType } from '../../utils/repository';

export interface RepositoryIconProps {
    objectType: eSystemObjectType;
    backgroundColor: string;
    textColor: string;
    overrideText?: string | undefined;
    makeStyles?: { [key: string]: string };
}

export function RepositoryIcon(props: RepositoryIconProps): React.ReactElement {
    const { objectType, overrideText, makeStyles } = props;
    const initial = !overrideText ? getTermForSystemObjectType(objectType).toUpperCase().slice(0, 1) : overrideText;

    return (
        <div className={makeStyles?.container} style={{ backgroundColor: makeStyles?.backgroundColor }}>
            <p className={makeStyles?.initial} style={{ color: makeStyles?.color }}>{initial}</p>
        </div>
    );
}
