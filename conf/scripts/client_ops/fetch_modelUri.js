#!/usr/bin/env node
/* eslint-disable camelcase */

const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

/**
 * 1. Configuration & Setup
 */
const API_BASE_URL = 'https://3d-api.si.edu/api/v1.0/content/file/search';

// Create interface to read from console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 2. Helper Function: Parse a CSV Line
 * Handles quoted fields containing commas correctly.
 */
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let quote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Toggle quote status
        if (char === '"' && text[i + 1] === '"') {
            // Handle escaped quotes ("") inside a quoted string
            cell += '"';
            i++;
        } else if (char === '"') {
            quote = !quote;
        } else if (char === ',' && !quote) {
            // If we hit a comma and aren't in quotes, end the cell
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell); // Push the last cell
    return result;
}

/**
 * 3. Helper Function: Escape CSV Field for Output
 * Wraps text in quotes if it contains commas or quotes.
 */
function escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

/**
 * 4. Core Function: Fetch Data from API
 * Returns a Promise that resolves with the list of models or rejects with an error.
 */
function fetchModelsForUUID(uuid) {
    return new Promise((resolve, reject) => {
        // Construct the URL
        const params = new URLSearchParams({
            q: '',
            model_url: `3d_package:${uuid}`,
            file_type: '',
            file_size: '',
            file_quality: 'Full_resolution', // As per prompt requirements
            model_type: '',
            gltf_orientation_compliant: '',
            draco_compressed: '',
            owning_unit: '',
            start: '0',
            rows: '10'
        });

        const url = `${API_BASE_URL}?${params.toString()}`;
        // console.log('URI: ',url);

        const options = {
            headers: {
                'User-Agent': 'Node.js/3D-Batch-Processor',
                'Accept': 'application/json'
            }
        };

        const req = https.get(url, options, (res) => {
            // Handle Redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // For simplicity in this script, we reject redirects to avoid infinite loops,
                // but usually APIs like this don't redirect on valid endpoints.
                reject(new Error(`Redirected to ${res.headers.location}`));
                return;
            }

            // Handle API Errors
            if (res.statusCode >= 400) {
                reject(new Error(`API Error: Status ${res.statusCode} ${res.statusMessage}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                try {
                    // console.log('data:',data);
                    const json = JSON.parse(data);

                    // Logic to extract models based on SI API structure
                    // Usually payload is json.response.docs
                    const items = json.rows ? json.rows : [];

                    if (!items || items.length === 0) {
                        // Success request, but no models found
                        resolve([]);
                        return;
                    }

                    // Extract the required pairs
                    const results = items.map(item => {
                        // Defensive checks to find the Name and URI
                        const name = item.label || item.name || item.title || 'Unknown Title';
                        const uri = (item.content && item.content.uri) ? item.content.uri : '';
                        return { name, uri };
                    });

                    resolve(results);
                } catch (e) {
                    reject(new Error('Failed to parse JSON response'));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Network Error: ${err.message}`));
        });
    });
}

/**
 * 5. Main Processing Logic
 */
async function processFile(inputPath) {
    console.log(`\nReading file: ${inputPath}...`);

    try {
        const fileContent = fs.readFileSync(inputPath, 'utf8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) {
            console.error('Error: CSV file appears to be empty or only has a header.');
            process.exit(1);
        }

        // Prepare Output Header
        // Original: Name, Project, UUID
        // New: Name, Project, UUID, Error, Model Name, Model URI
        const outputRows = [];
        outputRows.push(['Name', 'Project', 'UUID', 'Model Name', 'Model URI', 'Error'].join(','));

        // Skipping header row (index 0)
        // Data starts at index 1
        console.log(`Found ${lines.length - 1} records to process.`);
        const numLines = lines.length;

        for (let i = 1; i < numLines; i++) {
            const rowRaw = lines[i];
            const columns = parseCSVLine(rowRaw);

            // Mapping based on prompt: Name (A=0), Project (B=1), UUID (E=4)
            const name = columns[0] || '';
            const project = columns[1] || '';
            const uuid = columns[4] || '';

            // Clean UUID (remove quotes or whitespace if parser missed anything)
            const cleanUUID = uuid.replace(/['"]/g, '').trim();

            if (!cleanUUID) {
                console.log(`[${i}/${lines.length - 1}] Skipping row - No UUID found.`);
                continue;
            }

            process.stdout.write(`[${i}/${lines.length - 1}] Fetching ${cleanUUID.substring(0, 8)}... `);

            try {
                const models = await fetchModelsForUUID(cleanUUID);

                if (models.length === 0) {
                    // No models found, but request was successful
                    const csvRow = [
                        escapeCSV(name),
                        escapeCSV(project),
                        escapeCSV(cleanUUID),
                        '',
                        '',
                        escapeCSV('No Full Resolution models found')
                    ].join(',');
                    outputRows.push(csvRow);
                    console.log('Done (0 models).');
                } else {
                    // Create a row for EACH model returned
                    models.forEach(model => {
                        const csvRow = [
                            escapeCSV(name),
                            escapeCSV(project),
                            escapeCSV(cleanUUID),
                            escapeCSV(model.name),
                            escapeCSV(model.uri),
                            '', // No Error
                        ].join(',');
                        outputRows.push(csvRow);
                    });
                    console.log(`Done (${models.length} found).`);
                }

            } catch (err) {
                // Handle Errors (404, Network, etc)
                const csvRow = [
                    escapeCSV(name),
                    escapeCSV(project),
                    escapeCSV(cleanUUID),
                    '',
                    '',
                    escapeCSV(err.message)
                ].join(',');
                outputRows.push(csvRow);
                console.log(`Failed: ${err.message}`);
            }

            // Optional: Small delay to be polite to the API
            await new Promise(r => setTimeout(r, 100));
        }

        // 6. Write Result
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const base = path.basename(inputPath, ext);
        const outputPath = path.join(dir, `${base}_fullRes${ext}`);

        fs.writeFileSync(outputPath, outputRows.join('\n'));
        console.log('\n------------------------------------------------');
        console.log('Processing complete!');
        console.log(`Output saved to: ${outputPath}`);
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('Fatal Error:', e.message);
    } finally {
        rl.close();
    }
}

/**
 * 6. Start Script
 */
rl.question('Please enter the full path to your CSV file: ', (answer) => {
    // Remove quotes if user dragged/dropped file into terminal
    const inputPath = answer.replace(/['"]/g, '').trim();

    if (fs.existsSync(inputPath)) {
        processFile(inputPath);
    } else {
        console.error('Error: File does not exist at that path.');
        rl.close();
    }
});