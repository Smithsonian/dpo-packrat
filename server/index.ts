/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = 4000;

app.get('/', (request: Request, response: Response) => {
    const { hostname } = request;
    response.send(`Hello from Packrat server: ${hostname}`);
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});