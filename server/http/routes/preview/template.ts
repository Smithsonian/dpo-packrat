interface PreviewPageData {
    state: 'preview' | 'blocked' | 'retired' | 'not-found' | 'error';
    message?: string;

    // Only populated when state === 'preview'
    idSystemObject?: number;
    sceneName?: string;
    subjectNames?: string[];
    unitName?: string;
    licenseDisplay?: string;
    qcd?: boolean;
    publishedLabel?: string;
    voyagerRootUrl?: string;
    voyagerDocument?: string;
    sensitivityWarning?: boolean;
    packratBaseUrl?: string;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderPreviewPage(data: PreviewPageData): string {
    const title = 'Packrat — Scene Preview';

    if (data.state !== 'preview') {
        const lockSvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="11" width="14" height="10" rx="2" fill="#0079C4"/><path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#0079C4" stroke-width="2" fill="none"/></svg>';
        const searchSvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="6" stroke="#0079C4" stroke-width="2" fill="none"/><line x1="15.5" y1="15.5" x2="20" y2="20" stroke="#0079C4" stroke-width="2" stroke-linecap="round"/></svg>';
        const icon = data.state === 'not-found' ? searchSvg : lockSvg;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${baseStyles()}</style>
</head>
<body>
    <header class="pr-header">
        <span class="pr-header-title">Packrat</span>
    </header>
    <main class="pr-content">
        <div class="pr-message-card">
            <div class="pr-message-icon">${icon}</div>
            <p class="pr-message-text">${escapeHtml(data.message ?? 'An error occurred.')}</p>
            <a href="mailto:packrat@si.edu" class="pr-message-link">Contact packrat@si.edu</a>
        </div>
    </main>
</body>
</html>`;
    }

    const warningBanner = data.sensitivityWarning
        ? '<div class="pr-warning">&#9888; This object is marked as sensitive. Additional restrictions may apply.</div>'
        : '';

    const subjects = (data.subjectNames ?? []).map(s => escapeHtml(s)).join('<br>') || 'None';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://3d-api.si.edu/resources/js/voyager-explorer.min.js"></script>
    <style>${baseStyles()}${previewStyles()}</style>
</head>
<body>
    <header class="pr-header">
        <span class="pr-header-title">Packrat</span>
    </header>
    <main class="pr-content">
        ${warningBanner}
        <div class="pr-viewer">
            <voyager-explorer
                id="Voyager-Explorer"
                root="${escapeHtml(data.voyagerRootUrl ?? '')}"
                document="${encodeURIComponent(data.voyagerDocument ?? '')}"
                style="width: 100%; height: 500px; display: block; position: relative;">
            </voyager-explorer>
        </div>
        <table class="pr-meta">
            <tr><td class="pr-meta-label">Name</td><td>${escapeHtml(data.sceneName ?? '')}</td></tr>
            <tr><td class="pr-meta-label">Subject(s)</td><td>${subjects}</td></tr>
            <tr><td class="pr-meta-label">Unit</td><td>${escapeHtml(data.unitName ?? '')}</td></tr>
            <tr><td class="pr-meta-label">Published</td><td>${escapeHtml(data.publishedLabel ?? '')}</td></tr>
            <tr><td class="pr-meta-label">License</td><td>${escapeHtml(data.licenseDisplay ?? '')}</td></tr>
            <tr><td class="pr-meta-label">Is Reviewed</td><td>${data.qcd ? 'Reviewed' : 'Not Reviewed'}</td></tr>
        </table>
        <div class="pr-actions">
            <a href="${escapeHtml(data.packratBaseUrl ?? '')}/repository/details/${data.idSystemObject}"
               target="_blank" rel="noopener"
               class="pr-btn">Open in Packrat</a>
        </div>
    </main>
</body>
</html>`;
}

function baseStyles(): string {
    return `
        * { box-sizing: border-box; }
        body {
            background: #ECF5FD;
            font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            color: #2C405A;
        }
        .pr-header {
            background: #0079C4;
            color: #FFF;
            padding: 12px 24px;
            font-size: 20px;
            font-weight: 600;
        }
        .pr-content {
            max-width: 960px;
            margin: 0 auto;
            padding: 24px;
        }
        .pr-message-card {
            max-width: 480px;
            margin: 80px auto;
            text-align: center;
            background: #FFF;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .pr-message-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .pr-message-text {
            color: #2C405A;
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 16px;
        }
        .pr-message-link {
            color: #0079C4;
            text-decoration: none;
            font-weight: 500;
        }
        .pr-message-link:hover { text-decoration: underline; }
    `;
}

function previewStyles(): string {
    return `
        .pr-viewer {
            width: 90%;
            margin: 0 auto;
            background: #000;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 4px;
        }
        .pr-meta {
            width: 90%;
            margin: 12px auto;
            border-collapse: collapse;
            border: 1px solid #ccc;
        }
        .pr-meta td {
            padding: 4px 12px;
            border: 1px solid #ccc;
            vertical-align: top;
            font-weight: normal;
            color: #2C405A;
        }
        .pr-meta td.pr-meta-label {
            background: #0079C4;
            color: #FFF;
            width: 100px;
            white-space: nowrap;
        }
        .pr-actions {
            margin: 16px 0;
            text-align: center;
        }
        .pr-btn {
            display: inline-block;
            background: #0079C4;
            color: #FFF;
            padding: 10px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
        }
        .pr-btn:hover { background: #005f9e; }
        .pr-warning {
            background: #FFF3CD;
            color: #856404;
            padding: 10px 16px;
            border-radius: 4px;
            margin-bottom: 12px;
        }
    `;
}
