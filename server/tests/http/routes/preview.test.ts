/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Preview Route Tests
 *
 * These tests validate the restriction logic of the preview route handler.
 * They mock the database layer to test each restriction check in isolation.
 */

import { Request, Response } from 'express';

// --- Mocks must be declared before imports that use them ---

// Mock DBAPI
jest.mock('../../../db', () => ({
    ExternalSource: {
        fetchByClientId: jest.fn(),
    },
    SystemObject: {
        fetch: jest.fn(),
        fetchFromSceneID: jest.fn(),
    },
    Scene: {
        fetchByUUID: jest.fn(),
    },
    SystemObjectVersion: {
        fetchLatestFromSystemObject: jest.fn(),
    },
    ObjectProperty: {
        fetchDerivedFromObject: jest.fn(),
    },
    AssetVersion: {
        fetchLatestFromSystemObject: jest.fn(),
    },
    Asset: {
        fetch: jest.fn(),
    },
}));

// Mock cache
jest.mock('../../../cache', () => ({
    LicenseCache: {
        getLicenseResolver: jest.fn(),
    },
    VocabularyCache: {
        isPreferredAsset: jest.fn(),
    },
}));

// Mock ObjectGraph — keep a reference so tests can manipulate the instance
const mockOGInstance: any = {
    fetch: jest.fn().mockResolvedValue(true),
    subject: [],
    unit: [],
    project: [],
};
jest.mock('../../../db/api/composite/ObjectGraph', () => ({
    eObjectGraphMode: { eAncestors: 0 },
    ObjectGraph: jest.fn().mockImplementation(() => mockOGInstance),
}));

// Mock LicenseResolver
jest.mock('../../../db/api/composite/LicenseResolver', () => ({
    LicenseResolver: {
        fetch: jest.fn(),
    },
}));

// Mock TokenStore
jest.mock('../../../http/routes/TokenStore', () => ({
    TokenStore: {
        generate: jest.fn().mockReturnValue('mock-preview-token'),
    },
}));

// Mock AuditFactory
jest.mock('../../../audit/interface/AuditFactory', () => ({
    AuditFactory: {
        audit: jest.fn().mockResolvedValue(true),
    },
}));

// Mock RecordKeeper
jest.mock('../../../records/recordKeeper', () => ({
    RecordKeeper: {
        logInfo: jest.fn(),
        logError: jest.fn(),
        logDebug: jest.fn(),
        LogSection: { eHTTP: 'eHTTP' },
    },
}));

import { preview } from '../../../http/routes/preview';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import { LicenseResolver } from '../../../db/api/composite/LicenseResolver';

// Helper to create mock Request
function mockRequest(edanUUID: string, clientId?: string, userId?: string): Partial<Request> {
    return {
        params: { edanUUID },
        query: {
            clientId: clientId ?? 'valid-client-id',
            userId: userId ?? 'ext-user-1',
        } as any,
        headers: { referer: 'https://example.com' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:4000'),
    };
}

// Helper to create mock Response
function mockResponse(): { res: Partial<Response>; statusCode: number; body: string } {
    const result = { statusCode: 200, body: '' };
    const res: Partial<Response> = {
        status: jest.fn().mockImplementation((code: number) => {
            result.statusCode = code;
            return res;
        }),
        send: jest.fn().mockImplementation((html: string) => {
            result.body = html;
            return res;
        }),
    };
    return { res, ...result };
}

// Helper to set up a passing baseline (all checks pass)
function setupPassingBaseline() {
    (DBAPI.Scene.fetchByUUID as jest.Mock).mockResolvedValue([{ idScene: 1, Name: 'Test Scene', PosedAndQCd: true, EdanUUID: 'valid-uuid' }]);
    (DBAPI.SystemObject.fetchFromSceneID as jest.Mock).mockResolvedValue({ idSystemObject: 100, idScene: 1, Retired: false });
    (DBAPI.SystemObject.fetch as jest.Mock).mockResolvedValue({ idSystemObject: 100, idScene: 1 });
    (DBAPI.ExternalSource.fetchByClientId as jest.Mock).mockResolvedValue({ isActive: true, ClientId: 'valid-client-id', Name: 'Test' });
    (DBAPI.ObjectProperty.fetchDerivedFromObject as jest.Mock).mockResolvedValue([]);
    (DBAPI.SystemObjectVersion.fetchLatestFromSystemObject as jest.Mock).mockResolvedValue({ PublishedState: 1, DateCreated: new Date('2026-03-15') });
    (DBAPI.AssetVersion.fetchLatestFromSystemObject as jest.Mock).mockResolvedValue([{ idAsset: 1, FilePath: 'scenes', FileName: 'scene.svx.json' }]);
    (DBAPI.Asset.fetch as jest.Mock).mockResolvedValue({ idAsset: 1, idVAssetType: 10 });
    (CACHE.LicenseCache.getLicenseResolver as jest.Mock).mockResolvedValue({ License: { Name: 'CC0, Publishable w/ Downloads', RestrictLevel: 10 }, inherited: false });
    (CACHE.VocabularyCache.isPreferredAsset as jest.Mock).mockResolvedValue(true);
    (LicenseResolver.fetch as jest.Mock).mockResolvedValue(null);

    // Reset ObjectGraph mock
    mockOGInstance.subject = [{ Name: 'Test Subject' }];
    mockOGInstance.unit = [{ Name: 'Test Unit' }];
    mockOGInstance.project = [{ isRestricted: false }];
    mockOGInstance.fetch.mockResolvedValue(true);
}

describe('Preview Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupPassingBaseline();
    });

    test('returns 400 for missing edanUUID parameter', async () => {
        const req = mockRequest('');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Missing or invalid parameters'));
    });

    test('returns 404 when UUID does not match any scene', async () => {
        (DBAPI.Scene.fetchByUUID as jest.Mock).mockResolvedValue(null);
        const req = mockRequest('unknown-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Scene not found'));
    });

    test('returns 404 when scene has no SystemObject', async () => {
        (DBAPI.SystemObject.fetchFromSceneID as jest.Mock).mockResolvedValue(null);
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Scene not found'));
    });

    test('returns 403 for unknown clientId', async () => {
        (DBAPI.ExternalSource.fetchByClientId as jest.Mock).mockResolvedValue(null);
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Unauthorized source'));
    });

    test('returns 403 for inactive clientId', async () => {
        (DBAPI.ExternalSource.fetchByClientId as jest.Mock).mockResolvedValue({ isActive: false });
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Unauthorized source'));
    });

    test('returns retired message for retired scene', async () => {
        (DBAPI.SystemObject.fetchFromSceneID as jest.Mock).mockResolvedValue({ idSystemObject: 100, idScene: 1, Retired: true });
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('retired'));
    });

    test('returns blocked message for restricted project', async () => {
        mockOGInstance.project = [{ isRestricted: true }];
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('cannot be previewed'));
    });

    test('returns blocked message for sensitivity level 2', async () => {
        (DBAPI.ObjectProperty.fetchDerivedFromObject as jest.Mock).mockResolvedValue([{ PropertyType: 'sensitivity', Level: 2 }]);
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('cannot be previewed'));
    });

    test('returns blocked message for sensitivity level 3', async () => {
        (DBAPI.ObjectProperty.fetchDerivedFromObject as jest.Mock).mockResolvedValue([{ PropertyType: 'sensitivity', Level: 3 }]);
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('cannot be previewed'));
    });

    test('returns blocked message for restrictive license (RestrictLevel >= 1000)', async () => {
        (CACHE.LicenseCache.getLicenseResolver as jest.Mock).mockResolvedValue({ License: { Name: 'Restricted', RestrictLevel: 1000 }, inherited: false });
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('cannot be previewed'));
    });

    test('allows preview with permissive license (RestrictLevel < 1000)', async () => {
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('voyager-explorer'));
    });

    test('shows sensitivity warning banner for level 1', async () => {
        (DBAPI.ObjectProperty.fetchDerivedFromObject as jest.Mock).mockResolvedValue([{ PropertyType: 'sensitivity', Level: 1 }]);
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('voyager-explorer'));
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('sensitive'));
    });

    test('full preview includes metadata, header title, and Open in Packrat link', async () => {
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);

        const html = (res.send as jest.Mock).mock.calls[0][0];
        expect(html).toContain('voyager-explorer');
        expect(html).toContain('Test Scene');
        expect(html).toContain('Test Subject');
        expect(html).toContain('Test Unit');
        expect(html).toContain('Test Scene');
        expect(html).toContain('Open in Packrat');
        expect(html).toContain('/repository/details/100');
    });

    test('published label shows Unlisted (API Only) with date', async () => {
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        const html = (res.send as jest.Mock).mock.calls[0][0];
        expect(html).toContain('Unlisted (API Only)');
        expect(html).toContain('Published on 2026-03-15');
    });

    test('multiple subjects appear on separate lines', async () => {
        mockOGInstance.subject = [{ Name: 'Subject A' }, { Name: 'Subject B' }];
        const req = mockRequest('valid-uuid');
        const { res } = mockResponse();
        await preview(req as Request, res as Response);
        const html = (res.send as jest.Mock).mock.calls[0][0];
        expect(html).toContain('Subject A<br>Subject B');
    });
});
