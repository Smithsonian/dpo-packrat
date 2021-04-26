import EdanCollection from './EdanCollection';

export { EdanCollection };

/* istanbul ignore if */
if (!process.env.PACKRAT_EDAN_AUTH_KEY)
    throw Error('PACKRAT_EDAN_AUTH_KEY was not provided');
