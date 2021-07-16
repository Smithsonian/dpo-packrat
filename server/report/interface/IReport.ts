import * as H from '../../utils/helpers';

export interface IReport {
    append(content: string): Promise<H.IOResults>;
}
