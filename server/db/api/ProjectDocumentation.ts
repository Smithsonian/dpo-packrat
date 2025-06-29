/* eslint-disable camelcase */
import { ProjectDocumentation as ProjectDocumentationBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class ProjectDocumentation extends DBC.DBObject<ProjectDocumentationBase> implements ProjectDocumentationBase, SystemObjectBased {
    idProjectDocumentation!: number;
    idProject!: number;
    Name!: string;
    Description!: string;

    constructor(input: ProjectDocumentationBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ProjectDocumentation'; }
    public fetchID(): number { return this.idProjectDocumentation; }

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProjectDocumentation } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProjectDocumentation, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
            return null;
        }
    }

    static async fetch(idProjectDocumentation: number): Promise<ProjectDocumentation | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            return DBC.CopyObject<ProjectDocumentationBase, ProjectDocumentation>(
                await DBC.DBConnection.prisma.projectDocumentation.findUnique({ where: { idProjectDocumentation, }, }), ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
            return null;
        }
    }

    static async fetchAll(): Promise<ProjectDocumentation[] | null> {
        try {
            return DBC.CopyArray<ProjectDocumentationBase, ProjectDocumentation>(
                await DBC.DBConnection.prisma.projectDocumentation.findMany(), ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
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
            RK.logError(RK.LogSection.eDB,'fetch from Project failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
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
                WHERE PD.idProject IN (${Prisma.join(idProjects)})`, ProjectDocumentation);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch derived from Projects failed',H.Helpers.getErrorString(error),{ ...this },'DB.Project.Documentation');
            return null;
        }
    }
}

