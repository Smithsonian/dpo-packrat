/**
 * Type resolver for SystemObjectVersion
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';

const SystemObjectVersion = {
    CommentLink: async (parent: Parent): Promise<string | null> => {
        if (!parent.idSystemObjectVersion || !parent.Comment || parent.Comment.length <= 300)
            return null;
        return RouteBuilder.DownloadSystemObjectVersionComment(parent.idSystemObjectVersion, eHrefMode.ePrependServerURL);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    }
};

export default SystemObjectVersion;
