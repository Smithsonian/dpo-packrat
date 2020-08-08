/* eslint-disable camelcase */
import { Project as ProjectBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
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
                await DBC.DBConnection.prisma.project.create({
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
            return await DBC.DBConnection.prisma.project.update({
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
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idProject, }, }), SystemObject);
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
                await DBC.DBConnection.prisma.project.findOne({ where: { idProject, }, }), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Project.fetch', error);
            return null;
        }
    }

    static async fetchAll(): Promise<Project[] | null> {
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.project.findMany(), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Project.fetchAll', error);
            return null;
        }
    }

    /**
     * Computes the array of projects that are connected to any of the specified subjects.
     * Projects are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified subjects.
     * @param idSubjects Array of Subject.idSubject
     */
    static async fetchFromSubjects(idSubjects: number[]): Promise<Project[] | null> {
        if (!idSubjects || idSubjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.$queryRaw<Project[]>`
                SELECT DISTINCT P.*
                FROM Project AS P
                JOIN SystemObject AS SOP ON (P.idProject = SOP.idProject)
                JOIN SystemObjectXref AS SOX ON (SOP.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectDerived = SOS.idSystemObject)
                WHERE SOS.idSubject IN (${join(idSubjects)})`, Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.PRoject.fetchFromSubjects', error);
            return null;
        }
    }

    /**
     * Computes the array of projects that are connected to any of the specified subjects' units.
     * Projects are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any unit, which in turn is connected to any of the specified subjects.
     * @param idSubjects Array of Subject.idSubject
     */
    static async fetchFromSubjectsUnits(idSubjects: number[]): Promise<Project[] | null> {
        if (!idSubjects || idSubjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.$queryRaw<Project[]>`
                SELECT DISTINCT P.*
                FROM Project AS P
                JOIN SystemObject AS SOProject ON (P.idProject = SOProject.idProject)
                JOIN SystemObjectXref AS SOX ON (SOProject.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOUnit ON (SOX.idSystemObjectMaster = SOUnit.idSystemObject)
                JOIN Subject AS S ON (SOUnit.idUnit = S.idUnit)
                WHERE S.idSubject IN (${join(idSubjects)})`, Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.PRoject.fetchFromSubjectsUnits', error);
            return null;
        }
    }
}
