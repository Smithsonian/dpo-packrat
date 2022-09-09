import * as LOG from '../../utils/logger';
import { Request, Response } from 'express';

export function logtest(_: Request, response: Response): void {
    LOG.info('Logger Info Test', LOG.LS.eHTTP);
    LOG.error('Logger Error Test without error object', LOG.LS.eHTTP);
    LOG.error('Logger Error Test with error object', LOG.LS.eHTTP, new Error('Error Test'));
    response.send('Got Here');
}