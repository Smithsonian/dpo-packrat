/* eslint-disable camelcase */
import { Project as ProjectBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Project extends DBO.DBObject<ProjectBase> implements ProjectBase {
    idProject!: number;
    Name!: string;
    Description!: string | null;

    constructor(input: ProjectBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Name, Description } = this;
            ({ idProject: this.idProject, Name: this.Name, Description: this.Description } =
                await DBConnectionFactory.prisma.project.create({
                    data: {
                        Name,
                        Description,
                        SystemObject:   { create: { Retired: false }, },
                    }
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Project.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idProject, Name, Description } = this;
            return await DBConnectionFactory.prisma.project.update({
                where: { idProject, },
                data: { Name, Description, },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Project.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProject } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idProject, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.project.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idProject: number): Promise<Project | null> {
        try {
            return DBO.CopyObject<ProjectBase, Project>(
                await DBConnectionFactory.prisma.project.findOne({ where: { idProject, }, }), Project);
        } catch (error) {
            LOG.logger.error('DBAPI.Project.fetch', error);
            return null;
        }
    }

    static async fetchSystemObjectAndProject(idProject: number): Promise<SystemObjectBase & { Project: ProjectBase | null} | null> {
        try {
            return await DBConnectionFactory.prisma.systemObject.findOne({ where: { idProject, }, include: { Project: true, }, });
        } catch (error) {
            LOG.logger.error('DBAPI.Project.fetchSystemObjectAndProject', error);
            return null;
        }
    }
}
