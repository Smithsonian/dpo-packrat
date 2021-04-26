import * as LOG from '../../utils/logger';
import { Request, Response } from 'express';

export function logtest(_: Request, response: Response): void {
    LOG.info('Logger Info Test', LOG.LS.eSYS);
    response.send('Got Here');
}