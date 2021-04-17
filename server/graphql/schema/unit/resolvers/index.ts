import Unit from './types/Unit';
import Project from './types/Project';
import ProjectDocumentation from './types/ProjectDocumentation';
import Stakeholder from './types/Stakeholder';
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
import searchIngestionSubjects from './queries/searchIngestionSubjects';
import getIngestionProjectsForSubjects from './queries/getIngestionProjectsForSubjects';
import getIngestionItemsForSubjects from './queries/getIngestionItemsForSubjects';
import getSubjectsForUnit from './queries/getSubjectsForUnit';
import getItemsForSubject from './queries/getItemsForSubject';
import getObjectsForItem from './queries/getObjectsForItem';
import getProjectDocumentation from './queries/getProjectDocumentation';
import getUnitsFromNameSearch from './queries/getUnitsFromNameSearch';

const resolvers = {
    Query: {
        getUnit,
        getProject,
        getSubject,
        getItem,
        searchIngestionSubjects,
        getIngestionProjectsForSubjects,
        getIngestionItemsForSubjects,
        getSubjectsForUnit,
        getItemsForSubject,
        getObjectsForItem,
        getProjectDocumentation,
        getUnitsFromNameSearch
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
    Subject,
    Item
};

export default resolvers;
