/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as LOG from '../../utils/logger';
import { Request, Response } from 'express';

export function errorhandler(error, _req: Request, _res: Response, next): void {
    LOG.error('Error Handler', LOG.LS.eHTTP, error);
    next(error);
}