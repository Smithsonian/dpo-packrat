import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { LogSection } from '../../records/logger/log';

//#region LOGS:TESTING
const info = [
    {
        timestamp: new Date().toISOString(),
        message: 'User logged in successfully',
        data: { username: 'jdoe', loginTime: '2024-09-26T10:00:00Z' },
        level: 'info',
        audit: true,
        context: { section: 'AUTH', caller: 'LoginService', environment: 'prod', idUser: 1023, idRequest: 54321 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Fetched user profile',
        data: { userId: 1023, profileLoadedAt: '2024-09-26T10:01:00Z' },
        level: 'info',
        audit: false,
        context: { section: 'DB', caller: 'ProfileController', environment: 'dev', idUser: 1023, idRequest: 54322 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Item search completed',
        data: { query: 'ancient vases', results: 25, timeTaken: '1.2s' },
        level: 'info',
        audit: false,
        context: { section: 'COL', caller: 'SearchService', environment: 'prod', idUser: 1045, idRequest: 54323 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Data export initiated',
        data: { format: 'CSV', items: 1200 },
        level: 'info',
        audit: true,
        context: { section: 'STORE', caller: 'ExportService', environment: 'prod', idUser: 1023, idRequest: 54324 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Password changed',
        data: { userId: 1045, changeTime: '2024-09-26T10:02:00Z' },
        level: 'info',
        audit: true,
        context: { section: 'AUTH', caller: 'AccountService', environment: 'dev', idUser: 1045, idRequest: 54325 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'File uploaded',
        data: { filename: 'report.pdf', size: '2.3MB' },
        level: 'info',
        audit: true,
        context: { section: 'STORE', caller: 'UploadService', environment: 'prod', idUser: 1023, idRequest: 54326 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'New project created',
        data: { projectName: 'Artifact Analysis', projectId: 456 },
        level: 'info',
        audit: true,
        context: { section: 'WF', caller: 'ProjectService', environment: 'dev', idUser: 1023, idRequest: 54327 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'User logged out',
        data: { username: 'jdoe', logoutTime: '2024-09-26T10:03:00Z' },
        level: 'info',
        audit: true,
        context: { section: 'AUTH', caller: 'LogoutService', environment: 'prod', idUser: 1023, idRequest: 54328 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'User profile updated',
        data: { userId: 1023, changes: ['email', 'phone number'] },
        level: 'info',
        audit: true,
        context: { section: 'DB', caller: 'ProfileUpdateService', environment: 'prod', idUser: 1023, idRequest: 54329 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'System backup completed',
        data: { duration: '12m 30s', size: '1.5GB' },
        level: 'info',
        audit: false,
        context: { section: 'SYS', caller: 'BackupService', environment: 'prod', idUser: 1023, idRequest: 54330 }
    }
];
const error = [
    {
        timestamp: new Date().toISOString(),
        message: 'Login failed for user',
        data: { username: 'jdoe', reason: 'Invalid password' },
        level: 'error',
        audit: true,
        context: { section: 'AUTH', caller: 'LoginService', environment: 'prod', idUser: undefined, idRequest: 54331 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Database connection timeout',
        data: { retryCount: 3 },
        level: 'error',
        audit: false,
        context: { section: 'DB', caller: 'DBService', environment: 'prod', idUser: undefined, idRequest: 54332 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Failed to load user profile',
        data: { userId: 1023, error: 'User not found' },
        level: 'error',
        audit: false,
        context: { section: 'DB', caller: 'ProfileController', environment: 'prod', idUser: 1023, idRequest: 54333 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Search query failed',
        data: { query: 'ancient relics', error: 'Search index not available' },
        level: 'error',
        audit: false,
        context: { section: 'COL', caller: 'SearchService', environment: 'prod', idUser: 1045, idRequest: 54334 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Unauthorized access attempt',
        data: { path: '/admin/settings', username: 'jdoe' },
        level: 'error',
        audit: true,
        context: { section: 'AUTH', caller: 'AuthService', environment: 'prod', idUser: 1023, idRequest: 54335 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'File upload failed',
        data: { filename: 'report.pdf', reason: 'File too large' },
        level: 'error',
        audit: false,
        context: { section: 'STORE', caller: 'UploadService', environment: 'prod', idUser: 1023, idRequest: 54336 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Project creation failed',
        data: { projectName: 'New Archaeology Project', error: 'Duplicate project name' },
        level: 'error',
        audit: true,
        context: { section: 'WF', caller: 'ProjectService', environment: 'prod', idUser: 1023, idRequest: 54337 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'User logout failed',
        data: { username: 'jdoe', error: 'Session not found' },
        level: 'error',
        audit: false,
        context: { section: 'AUTH', caller: 'LogoutService', environment: 'prod', idUser: 1023, idRequest: 54338 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Profile update failed',
        data: { userId: 1023, error: 'Invalid email format' },
        level: 'error',
        audit: false,
        context: { section: 'DB', caller: 'ProfileUpdateService', environment: 'prod', idUser: 1023, idRequest: 54339 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'System backup failed',
        data: { error: 'Disk full', backupTime: '12m 30s' },
        level: 'error',
        audit: false,
        context: { section: 'SYS', caller: 'BackupService', environment: 'prod', idUser: 1023, idRequest: 54340 }
    }
];
const debug = [
    {
        timestamp: new Date().toISOString(),
        message: 'Starting login process',
        data: { username: 'jdoe' },
        level: 'debug',
        audit: false,
        context: { section: 'AUTH', caller: 'LoginService', environment: 'prod', idUser: undefined, idRequest: 54341 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Fetching data from cache',
        data: { cacheKey: 'user:1023' },
        level: 'debug',
        audit: false,
        context: { section: 'CACHE', caller: 'CacheService', environment: 'dev', idUser: 1023, idRequest: 54342 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Executing search query',
        data: { query: 'ancient tools', filters: { year: '1200 BC', material: 'stone' } },
        level: 'debug',
        audit: false,
        context: { section: 'COL', caller: 'SearchService', environment: 'prod', idUser: 1045, idRequest: 54343 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Building user profile response',
        data: { userId: 1023, responseTime: '25ms' },
        level: 'debug',
        audit: false,
        context: { section: 'DB', caller: 'ProfileService', environment: 'prod', idUser: 1023, idRequest: 54344 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Verifying file upload',
        data: { filename: 'data.csv', expectedSize: '1.1MB' },
        level: 'debug',
        audit: false,
        context: { section: 'STORE', caller: 'UploadService', environment: 'prod', idUser: 1023, idRequest: 54345 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Starting database transaction',
        data: { transactionId: 'abc123' },
        level: 'debug',
        audit: false,
        context: { section: 'DB', caller: 'DBService', environment: 'prod', idUser: 1023, idRequest: 54346 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'API request received',
        data: { method: 'GET', endpoint: '/api/v1/items' },
        level: 'debug',
        audit: false,
        context: { section: 'HTTP', caller: 'APIController', environment: 'prod', idUser: 1045, idRequest: 54347 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Parsing CSV file',
        data: { filename: 'report.csv', lines: 1024 },
        level: 'debug',
        audit: false,
        context: { section: 'STORE', caller: 'CSVParserService', environment: 'dev', idUser: 1023, idRequest: 54348 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Rendering PDF report',
        data: { template: 'financial-summary', userId: 1023 },
        level: 'debug',
        audit: false,
        context: { section: 'RPT', caller: 'ReportService', environment: 'prod', idUser: 1023, idRequest: 54349 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Cleaning up temporary files',
        data: { path: '/tmp/uploads', deletedFiles: 3 },
        level: 'debug',
        audit: false,
        context: { section: 'STORE', caller: 'CleanupService', environment: 'prod', idUser: 1023, idRequest: 54350 }
    }
];
const warning = [
    {
        timestamp: new Date().toISOString(),
        message: 'User session nearing timeout',
        data: { userId: 1023, timeRemaining: '2 minutes' },
        level: 'warn',
        audit: false,
        context: { section: 'AUTH', caller: 'SessionManager', environment: 'prod', idUser: 1023, idRequest: 54351 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'File upload took longer than expected',
        data: { filename: 'large_dataset.zip', duration: '3 minutes' },
        level: 'warn',
        audit: false,
        context: { section: 'STORE', caller: 'UploadService', environment: 'prod', idUser: 1023, idRequest: 54352 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Cache miss for user profile',
        data: { userId: 1023 },
        level: 'warn',
        audit: false,
        context: { section: 'CACHE', caller: 'CacheService', environment: 'dev', idUser: 1023, idRequest: 54353 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Query execution time exceeded threshold',
        data: { query: 'SELECT * FROM artifacts', executionTime: '4.5s', threshold: '2s' },
        level: 'warn',
        audit: false,
        context: { section: 'DB', caller: 'DBService', environment: 'prod', idUser: undefined, idRequest: 54354 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'API rate limit approaching',
        data: { userId: 1045, requests: 95, limit: 100 },
        level: 'warn',
        audit: false,
        context: { section: 'HTTP', caller: 'RateLimiter', environment: 'prod', idUser: 1045, idRequest: 54355 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Disk space usage exceeded 80%',
        data: { disk: '/dev/sda1', usage: '82%' },
        level: 'warn',
        audit: false,
        context: { section: 'SYS', caller: 'DiskMonitorService', environment: 'prod', idUser: undefined, idRequest: 54356 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'User input contained invalid characters',
        data: { userId: 1023, inputField: 'username', inputValue: 'john_doe!@#' },
        level: 'warn',
        audit: false,
        context: { section: 'DB', caller: 'ValidationService', environment: 'prod', idUser: 1023, idRequest: 54357 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Data export could not complete in the expected time',
        data: { format: 'CSV', expectedDuration: '2 minutes', actualDuration: '6 minutes' },
        level: 'warn',
        audit: false,
        context: { section: 'STORE', caller: 'ExportService', environment: 'prod', idUser: 1023, idRequest: 54358 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Failed to send notification email',
        data: { userId: 1023, email: 'jdoe@example.com', reason: 'SMTP timeout' },
        level: 'warn',
        audit: false,
        context: { section: 'SYS', caller: 'EmailService', environment: 'prod', idUser: 1023, idRequest: 54359 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'System memory usage high',
        data: { memoryUsage: '91%', process: 'ImageMagick' },
        level: 'warn',
        audit: false,
        context: { section: 'SYS', caller: 'MemoryMonitor', environment: 'prod', idUser: undefined, idRequest: 54360 }
    }
];
const critical = [
    {
        timestamp: new Date().toISOString(),
        message: 'Database connection lost',
        data: { reason: 'Database server not reachable', attemptCount: 3 },
        level: 'crit',
        audit: true,
        context: { section: 'DB', caller: 'DBService', environment: 'prod', idUser: undefined, idRequest: 54361 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Data corruption detected during file upload',
        data: { filename: 'artifact_data.zip', corruptionDetails: 'Checksum mismatch' },
        level: 'crit',
        audit: true,
        context: { section: 'STORE', caller: 'UploadService', environment: 'prod', idUser: 1023, idRequest: 54362 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Unauthorized access attempt detected',
        data: { userId: 1045, action: 'Attempt to modify system settings' },
        level: 'crit',
        audit: true,
        context: { section: 'AUTH', caller: 'AuthService', environment: 'prod', idUser: 1045, idRequest: 54363 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'System storage full',
        data: { disk: '/dev/sda1', usage: '100%' },
        level: 'crit',
        audit: true,
        context: { section: 'SYS', caller: 'DiskMonitorService', environment: 'prod', idUser: undefined, idRequest: 54364 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Critical file missing for project',
        data: { projectId: 456, missingFile: 'project_plan.pdf' },
        level: 'crit',
        audit: true,
        context: { section: 'WF', caller: 'ProjectService', environment: 'prod', idUser: 1023, idRequest: 54365 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Multiple failed login attempts',
        data: { userId: 1023, attempts: 5, lockoutTime: '15 minutes' },
        level: 'crit',
        audit: true,
        context: { section: 'AUTH', caller: 'LoginService', environment: 'prod', idUser: 1023, idRequest: 54366 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'System overheating detected',
        data: { cpuTemp: '95°C', shutdownInitiated: true },
        level: 'crit',
        audit: true,
        context: { section: 'SYS', caller: 'TemperatureMonitor', environment: 'prod', idUser: undefined, idRequest: 54367 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Failed to rollback transaction after critical error',
        data: { transactionId: 'abc123', reason: 'Database timeout' },
        level: 'crit',
        audit: true,
        context: { section: 'DB', caller: 'DBService', environment: 'prod', idUser: undefined, idRequest: 54368 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'Fatal error during user profile update',
        data: { userId: 1023, error: 'Null pointer exception' },
        level: 'crit',
        audit: true,
        context: { section: 'DB', caller: 'ProfileUpdateService', environment: 'prod', idUser: 1023, idRequest: 54369 }
    },
    {
        timestamp: new Date().toISOString(),
        message: 'AUTH breach detected: data exfiltration attempt',
        data: { userId: 1045, action: 'Attempted data export of 100GB' },
        level: 'crit',
        audit: true,
        context: { section: 'AUTH', caller: 'AUTHMonitor', environment: 'prod', idUser: 1045, idRequest: 54370 }
    }
];
const logLevels = {
    info,
    warning,
    error,
    critical,
    debug,
};
const generateRandomLog = (index: number) => {
    const levels = Object.keys(logLevels);

    // Randomly pick a log level
    const randomLevel = levels[Math.floor(Math.random() * levels.length)] as keyof typeof logLevels;

    // Randomly pick a log entry from the chosen level's log array
    const randomLog = logLevels[randomLevel][Math.floor(Math.random() * logLevels[randomLevel].length)];

    // Destructure the log entry to access necessary fields
    const { section, caller } = randomLog.context;
    const { message, data, audit } = randomLog;
    const logSection = section as LogSection;
    data['index'] = index;

    // console.log(index);

    // Call the corresponding log routine based on the log level
    switch (randomLevel) {
        case 'critical':
            RK.logCritical(logSection, message, data, `${String(index).padStart(5,'0')} - `+caller, audit);
            break;
        case 'error':
            RK.logError(logSection, message, data, `${String(index).padStart(5,'0')} - `+caller, audit);
            break;
        case 'warning':
            RK.logWarning(logSection, message, data, `${String(index).padStart(5,'0')} - `+caller, audit);
            break;
        case 'info':
            RK.logInfo(logSection, message, data, `${String(index).padStart(5,'0')} - `+caller, audit);
            break;
        case 'debug':
            RK.logDebug(logSection, message, data, `${String(index).padStart(5,'0')} - `+caller, audit);
            break;
    }
};
const testLogsStagger = (count: number): void => {
    // Random interval between 10,000ms (10s) and 60,000ms (1 min)
    const randomInterval = Math.floor(Math.random() * 10000) + 1000;

    // if we're less than zero then we're done
    if(count<=0)
        return;

    // Call the function after the random interval
    setTimeout(() => {
        generateRandomLog(count);
        // Call the function again to continue the loop
        testLogsStagger(count--);
    }, randomInterval);
};
const testLogs = (doStagger: boolean, count: number | undefined): void => {

    const numLogs: number = (count) ? count : 100;

    // do we spread them out or do all at once
    if(doStagger===true)
        testLogsStagger(numLogs);
    else {
        for(let i=0; i<numLogs; ++i)
            generateRandomLog(i);
    }
};
//#endregion

export const play = async (_req: Request, res: Response): Promise<void> => {

    RK.configure(); // 'D:\\Temp\\PackratTemp\\Logs'

    RK.profile('Playtime', LogSection.eHTTP, 'log tests',undefined,'API.sandbox.play');

    // test our logging
    const numLogs: number = 100000;
    testLogs(false,numLogs);

    while(RK.logTotalCount() < numLogs)
        await H.Helpers.sleep(1000);

    // close our profiler
    RK.profileEnd('Playtime');
    // RK.cleanup();
    res.status(200).send(H.Helpers.JSONStringify({ message: `Processed ${numLogs} log events` }));
};