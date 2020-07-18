/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Project as ProjectBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Project extends DBC.DBObject<ProjectBase> implements ProjectBase {
    idProject!: number;
    Name!: string;
    Description!: string | null;

    constructor(input: ProjectBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, Description } = this;
            ({ idProject: this.idProject, Name: this.Name, Description: this.Description } =
                await DBC.DBConnectionFactory.prisma.project.create({
                    data: {
                        Name,
                        Description,
                        SystemObject:   { create: { Retired: false }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Project.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idProject, Name, Description } = this;
            return await DBC.DBConnectionFactory.prisma.project.update({
                where: { idProject, },
                data: { Name, Description, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Project.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProject } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idProject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.project.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idProject: number): Promise<Project | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyObject<ProjectBase, Project>(
                await DBC.DBConnectionFactory.prisma.project.findOne({ where: { idProject, }, }), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Project.fetch', error);
            return null;
        }
    }
}
