/**
 * Type resolver for Workflow
 */
import { Project, User, WorkflowTemplate, SystemObject, WorkflowStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Workflow = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return prisma.workflow.findOne({ where: { idWorkflow } }).Project();
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return prisma.workflow.findOne({ where: { idWorkflow } }).User();
    },
    WorkflowTemplate: async (parent: Parent, _: Args, context: Context): Promise<WorkflowTemplate | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return prisma.workflow.findOne({ where: { idWorkflow } }).WorkflowTemplate();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return prisma.workflow.findOne({ where: { idWorkflow } }).SystemObject();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return prisma.workflow.findOne({ where: { idWorkflow } }).WorkflowStep();
    }
};

export default Workflow;
