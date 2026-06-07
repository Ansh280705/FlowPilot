import { pgTable, uuid, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  plan: text('plan').notNull().default('free'), // free, pro, enterprise
});

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  steps: jsonb('steps').notNull().$type<any[]>(),
  variables: jsonb('variables').$type<any[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id),
  isPublic: boolean('is_public').notNull().default(false),
  tags: jsonb('tags').$type<string[]>(),
});

export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  status: text('status').notNull(), // pending, running, completed, failed, paused, stopped
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  variables: jsonb('variables').notNull().$type<Record<string, string>>(),
  currentStep: integer('current_step').notNull().default(0),
  logs: jsonb('logs').notNull().$type<any[]>(),
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  userId: uuid('user_id').notNull().references(() => users.id),
  url: text('url'),
});

export const workflowVariables = pgTable('workflow_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // string, number, boolean, csv
  defaultValue: text('default_value'),
  description: text('description'),
  required: boolean('required').notNull().default(false),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  type: text('type').notNull(), // image, pdf
  extractedText: text('extracted_text'),
  extractedData: jsonb('extracted_data').$type<Record<string, string>>(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id),
  workflowId: uuid('workflow_id').references(() => workflows.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(workflows),
  executions: many(executions),
  documents: many(documents),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  executions: many(executions),
  variables: many(workflowVariables),
  documents: many(documents),
}));

export const executionsRelations = relations(executions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [executions.userId],
    references: [users.id],
  }),
}));

export const workflowVariablesRelations = relations(workflowVariables, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVariables.workflowId],
    references: [workflows.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  workflow: one(workflows, {
    fields: [documents.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));
