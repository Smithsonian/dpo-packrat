/* eslint-disable camelcase */
import { ProjectDocumentation as ProjectDocumentationBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ProjectDocumentation extends DBC.DBObject<ProjectDocumentationBase> implements ProjectDocumentationBase, SystemObjectBased {
    idProjectDocumentation!: number;
    Description!: string;
    idProject!: number;
    Name!: string;

    constructor(input: ProjectDocumentationBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idProject, Name, Description } = this;
            ({ idProjectDocumentation: this.idProjectDocumentation, idProject: this.idProject,
                Name: this.Name, Description: this.Description } =
                await DBC.DBConnection.prisma.projectDocumentation.create({
                    data: {
                        Project:        { connect: { idProject }, },
                        Name,
                        Description,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ProjectDocumentation.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idProjectDocumentation, idProject, Name, Description } = this;
            return await DBC.DBConnection.prisma.projectDocumentation.update({
                where: { idProjectDocumentation, },
                data: {
                    Project:        { connect: { idProject }, },
                    Name,
                    Description,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ProjectDocumentation.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProjectDocumentation } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idProjectDocumentation, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.projectDocumentation.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idProjectDocumentation: number): Promise<ProjectDocumentation | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            return DBC.CopyObject<ProjectDocumentationBase, ProjectDocumentation>(
                await DBC.DBConnection.prisma.projectDocumentation.findOne({ where: { idProjectDocumentation, }, }), ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ProjectDocumentation.fetch', error);
            return null;
        }
    }

    static async fetchFromProject(idProject: number): Promise<ProjectDocumentation[] | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyArray<ProjectDocumentationBase, ProjectDocumentation>(
                await DBC.DBConnection.prisma.projectDocumentation.findMany({ where: { idProject } }), ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ProjectDocumentation.fetchFromProject', error);
            return null;
        }
    }

    /**
     * Computes the array of ProjectDocumentation that are connected to any of the specified projects.
     * @param idProjects Array of Project.idProject
     */
    static async fetchDerivedFromProjects(idProjects: number[]): Promise<ProjectDocumentation[] | null> {
        if (!idProjects || idProjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectDocumentationBase, ProjectDocumentation>(
                await DBC.DBConnection.prisma.$queryRaw<ProjectDocumentation[]>`
                SELECT DISTINCT PD.*
                FROM ProjectDocumentation AS PD
                WHERE PD.idProject IN (${join(idProjects)})`, ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ProjectDocumentation.fetchDerivedFromProjects', error);
            return null;
        }
    }
}

