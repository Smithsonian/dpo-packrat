/* eslint-disable camelcase */
import { Project as ProjectBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Project extends DBC.DBObject<ProjectBase> implements ProjectBase, SystemObjectBased {
    idProject!: number;
    Name!: string;
    Description!: string | null;

    constructor(input: ProjectBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Project'; }
    public fetchID(): number { return this.idProject; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, Description } = this;
            ({ idProject: this.idProject, Name: this.Name, Description: this.Description } =
                await DBC.DBConnection.prisma.project.create({
                    data: {
                        Name,
                        Description,
                        SystemObject: { create: { Retired: false }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Project.create', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Project.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idProject } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idProject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.project.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idProject: number): Promise<Project | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyObject<ProjectBase, Project>(
                await DBC.DBConnection.prisma.project.findUnique({ where: { idProject, }, }), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Project.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Project[] | null> {
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.project.findMany({ orderBy: { Name: 'asc' } }), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Project.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of projects that are indirectly connected to any of the specified subjects, via those subjects' items:
     * Subjects (Master) -> Item (Derived) ... Item (Derived) -> Project (Master)
     * @param idSubjects Array of Subject.idSubject
     */
    static async fetchRelatedToSubjects(idSubjects: number[]): Promise<Project[] | null> {
        if (!idSubjects || idSubjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.$queryRaw<Project[]>`
                SELECT DISTINCT P.*
                FROM Project AS P
                JOIN SystemObject AS SOP ON (P.idProject = SOP.idProject)
                JOIN SystemObjectXref AS SOXP ON (SOP.idSystemObject = SOXP.idSystemObjectMaster)
                JOIN SystemObject AS SOI ON (SOXP.idSystemObjectDerived = SOI.idSystemObject)
                JOIN SystemObjectXref AS SOXI ON (SOI.idSystemObject = SOXI.idSystemObjectDerived)
                JOIN SystemObject AS SOS ON (SOXI.idSystemObjectMaster = SOS.idSystemObject)
                WHERE SOI.idItem IS NOT NULL
                  AND SOS.idSubject IN (${Prisma.join(idSubjects)})`, Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.PRoject.fetchMasterFromSubjects', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of projects that are connected to any of the specified stakeholders.
     * Projects are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified stakeholders.
     * @param idStakeholders Array of Stakeholder.idStakeholder
     */
    static async fetchMasterFromStakeholders(idStakeholders: number[]): Promise<Project[] | null> {
        if (!idStakeholders || idStakeholders.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.$queryRaw<Project[]>`
                SELECT DISTINCT P.*
                FROM Project AS P
                JOIN SystemObject AS SOP ON (P.idProject = SOP.idProject)
                JOIN SystemObjectXref AS SOX ON (SOP.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectDerived = SOS.idSystemObject)
                WHERE SOS.idStakeholder IN (${Prisma.join(idStakeholders)})`, Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.PRoject.fetchMasterFromSubjects', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of projects that are connected to any of the specified project documentation.
     * @param idProjectDocumentations Array of ProjectDocumentation.idProjectDocumentation
     */
    static async fetchMasterFromProjectDocumentations(idProjectDocumentations: number[]): Promise<Project[] | null> {
        if (!idProjectDocumentations || idProjectDocumentations.length == 0)
            return null;
        try {
            return DBC.CopyArray<ProjectBase, Project>(
                await DBC.DBConnection.prisma.$queryRaw<Project[]>`
                SELECT DISTINCT P.*
                FROM Project AS P
                JOIN ProjectDocumentation AS PD ON (PD.idProject = P.idProject)
                WHERE PD.idProjectDocumentation IN (${Prisma.join(idProjectDocumentations)})`, Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.PRoject.fetchMasterFromProjectDocumentations', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchProjectList(search: string): Promise<Project[] | null> {
        if (!search)
            return this.fetchAll();
        try {
            return DBC.CopyArray<ProjectBase, Project>(await DBC.DBConnection.prisma.project.findMany({
                orderBy: { Name: 'asc' },
                where: { Name: { contains: search }, },
            }), Project);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Project.fetchProjectList', LOG.LS.eDB, error);
            return null;
        }
    }
}
