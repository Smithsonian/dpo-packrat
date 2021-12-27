import internal from 'stream';
import { RouteBuilder, eHrefMode } from './routeBuilder';

export class SitemapGenerator {
    static sitemapEntries: string[] = [
        '/repository',
        '/ingestion',
        '/workflow',
        '/admin/licenses',
        '/admin/licenses/create',
        '/admin/users',
        '/admin/users/create',
        '/admin/projects',
        '/admin/projects/create',
        '/admin/units',
        '/admin/units/create',
        '/admin/subjects',
        '/admin/subjects/create',
    ];

    static async generate(writable: internal.Writable): Promise<boolean> {
        writable.write('<?xml version="1.0" encoding="UTF-8"?>\n');
        writable.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
        for (const entry of SitemapGenerator.sitemapEntries)
            writable.write(`<url><loc>${RouteBuilder.ApplyPrefix(entry, eHrefMode.ePrependClientURL)}</loc></url>\n`);
        writable.write('</urlset>\n');
        return true;
    }
}