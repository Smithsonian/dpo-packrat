/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';

export function errorhandler(error, _req: Request, _res: Response, next): void {
    RK.logError(RK.LogSection.eHTTP,'HTTP error handler',error,H.Helpers.cleanExpressRequest(_req),'HTTP.ErrorHandler');
    next(error);
}