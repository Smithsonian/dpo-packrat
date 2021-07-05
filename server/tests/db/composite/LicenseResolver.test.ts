// import * as DBAPI from '../../../db';
// import * as UTIL from '../api';
// import * as LOG from '../../../utils/logger';
import { ObjectGraphTestSetup } from './ObjectGraph.setup';

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

// *******************************************************************
// DB Composite LicenseResolver
// *******************************************************************
describe('DB Composite LicenseResolver', () => {
    test('DB Object Creation', async () => {
        await OHTS.initialize();
        await OHTS.wire();
    });

    test('DB Composite DB Object Creation', async () => {
        await OHTS.initialize();
        await OHTS.wire();
    });
});