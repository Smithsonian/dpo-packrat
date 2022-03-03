import Unit from './types/Unit';
import Project from './types/Project';
import ProjectDocumentation from './types/ProjectDocumentation';
import Stakeholder from './types/Stakeholder';
import Subject from './types/Subject';
import Item from './types/Item';
import UnitEdan from './types/UnitEdan';
import getUnit from './queries/getUnit';
import getProject from './queries/getProject';
import getSubject from './queries/getSubject';
import getItem from './queries/getItem';
import createUnit from './mutations/createUnit';
import createProject from './mutations/createProject';
import createSubject from './mutations/createSubject';
import searchIngestionSubjects from './queries/searchIngestionSubjects';
import getIngestionProjectsForSubjects from './queries/getIngestionProjectsForSubjects';
import getIngestionItemsForSubjects from './queries/getIngestionItemsForSubjects';
import getIngestionItems from './queries/getIngestionItems';
import getSubjectsForUnit from './queries/getSubjectsForUnit';
import getItemsForSubject from './queries/getItemsForSubject';
import getObjectsForItem from './queries/getObjectsForItem';
import getProjectDocumentation from './queries/getProjectDocumentation';
import getUnitsFromNameSearch from './queries/getUnitsFromNameSearch';
import getUnitsFromEdanAbbreviation from './queries/getUnitsFromEdanAbbreviation';
import createGeoLocation from './mutations/createGeoLocation';
import getEdanUnitsNamed from './queries/getEdanUnitsNamed';

const resolvers = {
    Query: {
        getUnit,
        getProject,
        getSubject,
        getItem,
        searchIngestionSubjects,
        getIngestionProjectsForSubjects,
        getIngestionItemsForSubjects,
        getIngestionItems,
        getSubjectsForUnit,
        getItemsForSubject,
        getObjectsForItem,
        getProjectDocumentation,
        getUnitsFromNameSearch,
        getUnitsFromEdanAbbreviation,
        getEdanUnitsNamed
    },
    Mutation: {
        createUnit,
        createProject,
        createSubject,
        createGeoLocation
    },
    Unit,
    Project,
    ProjectDocumentation,
    Stakeholder,
    Subject,
    Item,
    UnitEdan
};

export default resolvers;
