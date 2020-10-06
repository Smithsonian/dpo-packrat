import EdanCollection from './EdanCollection';

export { EdanCollection };

/* istanbul ignore if */
if (!process.env.EDAN_AUTH_KEY)
    throw Error('EDAN_AUTH_KEY was not provided');
