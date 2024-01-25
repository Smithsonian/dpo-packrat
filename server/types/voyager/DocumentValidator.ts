/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import AjvCore from 'ajv';

import documentSchema from './json/document.schema.json';
import commonSchema from './json/common.schema.json';
import metaSchema from './json/meta.schema.json';
import modelSchema from './json/model.schema.json';
import setupSchema from './json/setup.schema.json';

import { IDocument } from './document';

import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

////////////////////////////////////////////////////////////////////////////////

export class DocumentValidator {
    private _schemaValidator;
    private _validateDocument;

    constructor() {
        this._schemaValidator = new AjvCore({
            schemas: [
                documentSchema,
                commonSchema,
                metaSchema,
                modelSchema,
                setupSchema,
            ],
            allErrors: true
        });

        this._validateDocument = this._schemaValidator.getSchema(
            'https://schemas.3d.si.edu/voyager/document.schema.json'
        );
    }

    validate(document: IDocument): H.IOResults {
        if (!this._validateDocument(document)) {
            const error: string = this._schemaValidator.errorsText(this._validateDocument.errors, { separator: ', ', dataVar: 'document' });
            LOG.error(error, LOG.LS.eSYS);
            return { success: false, error };
        }

        // if (ENV_DEVELOPMENT) {
        //     console.log('JSONValidator.validateDocument - OK');
        // }

        return { success: true };
    }
}