import Unit from './types/Unit';
import Project from './types/Project';
import ProjectDocumentation from './types/ProjectDocumentation';
import Stakeholder from './types/Stakeholder';
import GeoLocation from './types/GeoLocation';
import Subject from './types/Subject';
import Item from './types/Item';
import getUnit from './queries/getUnit';
import getProject from './queries/getProject';
import getSubject from './queries/getSubject';
import getItem from './queries/getItem';
import createUnit from './mutations/createUnit';
import createProject from './mutations/createProject';
import createSubject from './mutations/createSubject';
import createItem from './mutations/createItem';

const resolvers = {
    Query: {
        getUnit,
        getProject,
        getSubject,
        getItem
    },
    Mutation: {
        createUnit,
        createProject,
        createSubject,
        createItem
    },
    Unit,
    Project,
    ProjectDocumentation,
    Stakeholder,
    GeoLocation,
    Subject,
    Item
};

export default resolvers;
