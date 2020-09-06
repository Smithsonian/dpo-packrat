import { ReadStream } from 'fs';
import csv from 'csv-parser';
import { CSVHeaders, CSVTypes, CSVFields, SubjectsCSVFields, ItemsCSVFields } from './csvTypes';
import * as DBAPI from '../../db';
import { Subject, Item, Identifier, SystemObject } from '@prisma/client';

export class Parser {
    static async getSubjects(fileStream: ReadStream): Promise<Subject[]> {
        const bagitSubjects = await this.parseCSV<SubjectsCSVFields>(fileStream, CSVTypes.subjects);

        const subjects: Subject[] = [];

        for (const bagitSubject of bagitSubjects) {
            const identifiers: Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitSubject.subject_name);
            if (identifiers) {
                for (const identifier of identifiers) {
                    if (identifier.idSystemObject) {
                        const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(identifier.idSystemObject);
                        if (systemObject && systemObject.idSubject) {
                            const subject: Subject | null = await DBAPI.Subject.fetch(systemObject.idSubject);
                            if (subject) subjects.push(subject);
                        }
                    }
                }
            }
        }

        return subjects;
    }

    static async getItems(fileStream: ReadStream): Promise<Item[]> {
        const bagitItems = await this.parseCSV<ItemsCSVFields>(fileStream, CSVTypes.items);
        const items: Item[] = [];

        for (const bagitItem of bagitItems) {
            const identifiers: Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitItem.item_display_name);
            if (identifiers) {
                for (const identifier of identifiers) {
                    if (identifier.idSystemObject) {
                        const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(identifier.idSystemObject);
                        if (systemObject && systemObject.idItem) {
                            const item: Item | null = await DBAPI.Item.fetch(systemObject.idItem);
                            if (item) items.push(item);
                        }
                    }
                }
            }
        }

        return items;
    }

    static async parseCSV<T extends CSVFields>(fileStream: ReadStream, type: CSVTypes): Promise<T[]> {
        const requiredHeaders: string[] = CSVHeaders[type];

        return new Promise((resolve, reject) => {
            const mapHeaders = ({ header }) => {
                if (!requiredHeaders.includes(header)) {
                    stream.emit('error');
                }
                return header;
            };

            const stream = fileStream.pipe(csv({ mapHeaders }));
            const rows: T[] = [];

            stream.on('data', (data: T) => rows.push(data));
            stream.on('error', () => reject());
            stream.on('end', () => resolve(rows));
        });
    }
}

export * from './csvTypes';
