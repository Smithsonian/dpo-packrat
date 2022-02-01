/**
 * RepositoryIcon
 *
 * This component renders the icons for the repository tree view item.
 */
import React from 'react';
import { eSystemObjectType } from '../../types/server';
import { getTermForSystemObjectType, getDetailsUrlForObject } from '../../utils/repository';

export interface RepositoryIconProps {
    objectType: eSystemObjectType;
    backgroundColor: string;
    textColor: string;
    overrideText?: string | undefined;
    makeStyles?: { [key: string]: string };
    idSystemObject: number;
}

export function RepositoryIcon(props: RepositoryIconProps): React.ReactElement {
    const { objectType, overrideText, makeStyles, idSystemObject } = props;
    const initial = !overrideText ? getTermForSystemObjectType(objectType).toUpperCase().slice(0, 1) : overrideText;
    return (
        <a
            href={getDetailsUrlForObject(idSystemObject)}
            onClick={event => event.stopPropagation()}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`link to view system object of id ${idSystemObject}`}
            style={{ textDecoration: 'none' }}
        >
            <div className={makeStyles?.container} style={{ backgroundColor: makeStyles?.backgroundColor }}>
                <p className={makeStyles?.initial} style={{ color: '#232023' }}>{initial}</p>
            </div>
        </a>
    );
}
