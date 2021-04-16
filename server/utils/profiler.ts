import * as LOG from '../utils/logger';

/*
// c.f. https://stackoverflow.com/questions/29822773/passing-class-method-as-parameter-in-typescript/39366724
function bar(functionToProfile: (this: void) => any, thisArg?: undefined): any;
function bar<T>(functionToProfile: (this: T) => any, thisArg: T): any;
function bar<T, TResult>(functionToProfile: (this: T) => TResult, thisArg: T): TResult {
    return functionToProfile.call(thisArg);
}
*/

// export async function CreateProfile<TResult>(functionToProfile: (this: void) => TResult, thisArg?: undefined): Promise<TResult>;
export async function CreateProfile<T, TResult>(functionToProfile: (this: T) => Promise<TResult>, thisArg: T): Promise<TResult> {
    return new Promise<TResult>((resolve) => {
        const inspector = require('inspector');
        const fs = require('fs');
        const session = new inspector.Session();
        session.connect();

        session.post('Profiler.enable', async () => {
            LOG.info('Profiler.start', LOG.LS.eSYS);
            session.post('Profiler.start', async () => {
                // const retValue: boolean = await functionToProfile();
                const retValue: TResult = await functionToProfile.call(thisArg);
                resolve(retValue);

                // some time later...
                session.post('Profiler.stop', (err, { profile }) => {
                    // Write profile to disk
                    if (!err)
                        fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                    LOG.info('Profiler.stop', LOG.LS.eSYS);
                });
            });
        });
    });
}