/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import * as express from 'express';

const app = express();

app.get('/', (_, res) => res.send('hello from the server'));

app.listen(4000, () => {
    console.log('server is running on port 4000');
});