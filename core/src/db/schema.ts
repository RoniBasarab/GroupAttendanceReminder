// Drizzle schema (Postgres / Supabase). Node-only; reached via "@gar/core/db".
// Narrow, normalized tables so the dispatch path can scan members/tokens cheaply.
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import type { LessonField } from '../types';

export const formKind = pgEnum('form_kind', ['morning', 'evening']);
export const memberRole = pgEnum('member_role', ['admin', 'member']);
export const pushPlatform = pgEnum('push_platform', ['android', 'web']);
export const exceptionKind = pgEnum('exception_kind', ['extra', 'cancelled']);
export const submissionStatus = pgEnum('submission_status', ['submitted', 'failed']);

/** A class/group. The join code is shared with members; the admin is a member with role='admin'. */
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  joinCode: varchar('join_code', { length: 12 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A person in a group. Authenticated by a hashed device token; one row per (group, email). */
export const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    role: memberRole('role').notNull().default('member'),
    deviceTokenHash: text('device_token_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('members_group_idx').on(t.groupId),
    uniqueIndex('members_group_email_idx').on(t.groupId, t.email),
  ],
);

/** Per-group Google Form config (the sensitive URLs/field IDs now live here, not in files). */
export const formConfigs = pgTable(
  'form_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    kind: formKind('kind').notNull(),
    title: text('title').notNull(),
    formResponseUrl: text('form_response_url').notNull(),
    firstNameField: text('first_name_field').notNull(),
    lastNameField: text('last_name_field').notNull(),
    lessons: jsonb('lessons').$type<LessonField[]>().notNull(),
  },
  (t) => [uniqueIndex('form_configs_group_kind_idx').on(t.groupId, t.kind)],
);

/** Weekly recurrence: which weekday (0=Sunday..6=Saturday) is a study day and which form. */
export const weeklyStudyDays = pgTable(
  'weekly_study_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    weekday: smallint('weekday').notNull(),
    kind: formKind('kind').notNull(),
  },
  (t) => [uniqueIndex('weekly_group_weekday_idx').on(t.groupId, t.weekday)],
);

/** One-off overrides: 'extra' adds a study day (kind required); 'cancelled' removes one (kind null). */
export const scheduleExceptions = pgTable(
  'schedule_exceptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    exception: exceptionKind('exception').notNull(),
    kind: formKind('kind'),
  },
  (t) => [uniqueIndex('exceptions_group_date_idx').on(t.groupId, t.date)],
);

/** FCM registration tokens per member device (Android native or web PWA). */
export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    platform: pushPlatform('platform').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('push_tokens_member_idx').on(t.memberId)],
);

/** Dedupe for the 19:00 dispatch: one row per (group, study date) so the Vercel backup never double-sends. */
export const reminderLog = pgTable(
  'reminder_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    studyDate: date('study_date').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    recipientCount: integer('recipient_count').notNull().default(0),
  },
  (t) => [uniqueIndex('reminder_group_date_idx').on(t.groupId, t.studyDate)],
);

/** Idempotency for attendance: one row per (member, study date), with the outcome. */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    studyDate: date('study_date').notNull(),
    kind: formKind('kind').notNull(),
    status: submissionStatus('status').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('submissions_member_date_idx').on(t.memberId, t.studyDate)],
);

// Inferred row types for use in api/worker queries.
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type FormConfigRow = typeof formConfigs.$inferSelect;
export type NewFormConfigRow = typeof formConfigs.$inferInsert;
export type WeeklyStudyDay = typeof weeklyStudyDays.$inferSelect;
export type NewWeeklyStudyDay = typeof weeklyStudyDays.$inferInsert;
export type ScheduleException = typeof scheduleExceptions.$inferSelect;
export type NewScheduleException = typeof scheduleExceptions.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
export type ReminderLogRow = typeof reminderLog.$inferSelect;
export type NewReminderLogRow = typeof reminderLog.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
