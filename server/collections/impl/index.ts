import EdanCollection from './EdanCollection';

export { EdanCollection };

if (!process.env.EDAN_AUTH_KEY)
    throw Error('EDAN_AUTH_KEY was not provided');
