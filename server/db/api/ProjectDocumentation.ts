/* eslint-disable camelcase */
import { ProjectDocumentation as ProjectDocumentationBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ProjectDocumentation extends DBO.DBObject<ProjectDocumentationBase> implements ProjectDocumentationBase {
    idProjectDocumentation!: number;
    Description!: string;
    idProject!: number;
    Name!: string;

    constructor(input: ProjectDocumentationBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idProject, Name, Description } = this;
            ({ idProjectDocumentation: this.idProjectDocumentation, idProject: this.idProject,
                Name: this.Name, Description: this.Description } =
                await DBConnectionFactory.prisma.projectDocumentation.create({
                    data: {
                        Project:        { connect: { idProject }, },
                        Name,
                        Description,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.ProjectDocumentation.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idProjectDocumentation, idProject, Name, Description } = this;
            return await DBConnectionFactory.prisma.projectDocumentation.update({
                where: { idProjectDocumentation, },
                data: {
                    Project:        { connect: { idProject }, },
                    Name,
                    Description,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.ProjectDocumentation.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProjectDocumentation } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idProjectDocumentation, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.projectDocumentation.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idProjectDocumentation: number): Promise<ProjectDocumentation | null> {
        if (!idProjectDocumentation)
            return null;
        try {
            return DBO.CopyObject<ProjectDocumentationBase, ProjectDocumentation>(
                await DBConnectionFactory.prisma.projectDocumentation.findOne({ where: { idProjectDocumentation, }, }), ProjectDocumentation);
        } catch (error) {
            LOG.logger.error('DBAPI.ProjectDocumentation.fetch', error);
            return null;
        }
    }

    static async fetchFromProject(idProject: number): Promise<ProjectDocumentation[] | null> {
        if (!idProject)
            return null;
        try {
            return DBO.CopyArray<ProjectDocumentationBase, ProjectDocumentation>(
                await DBConnectionFactory.prisma.projectDocumentation.findMany({ where: { idProject } }), ProjectDocumentation);
        } catch (error) {
            LOG.logger.error('DBAPI.ProjectDocumentation.fetchFromProject', error);
            return null;
        }
    }
}

