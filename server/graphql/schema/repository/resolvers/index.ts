import getObjectChildren from './queries/getObjectChildren';
import getFilterViewData from './queries/getFilterViewData';

const resolvers = {
    Query: {
        getObjectChildren,
        getFilterViewData
    }
};

export default resolvers;
