import Unit from './types/Unit';
import Project from './types/Project';
import ProjectDocumentation from './types/ProjectDocumentation';
import Stakeholder from './types/Stakeholder';
import Subject from './types/Subject';
import Item from './types/Item';
import getUnit from './queries/getUnit';

const resolvers = {
    Query: {
        getUnit,
    },
    Unit,
    Project,
    ProjectDocumentation,
    Stakeholder,
    Subject,
    Item,
};

export default resolvers;