/**
 * scheduler/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Scheduler manager. Runs periodic maintenance jobs (cleanup, backups,
 * reminders) on cron schedules. Each job is an isolated module; a failure in
 * one never stops the others.
 * -----------------------------------------------------------------------------
 */

'use strict';

const cron = require('node-cron');

const logger = require('../shared/logger');
const cleanup = require('./cleanup');
const backups = require('./backups');
const reminders = require('./reminders');

const jobs = [];

/** Register and schedule all maintenance jobs. */
function startScheduler() {
  // Log rotation / session cleanup — daily at 04:00.
  const cleanupJob = cron.schedule('0 4 * * *', () => {
    cleanup.run().catch((e) => logger.error('[scheduler:cleanup]', { error: e.message }));
  });
  jobs.push(cleanupJob);

  // Periodic backups — daily at 03:00.
  const backupJob = cron.schedule('0 3 * * *', () => {
    backups.run().catch((e) => logger.error('[scheduler:backups]', { error: e.message }));
  });
  jobs.push(backupJob);

  // Reminders — every minute.
  const reminderJob = cron.schedule('* * * * *', () => {
    reminders.run().catch((e) => logger.error('[scheduler:reminders]', { error: e.message }));
  });
  jobs.push(reminderJob);

  logger.info(`[scheduler] started ${jobs.length} cron jobs`);
  return jobs;
}

function stopScheduler() {
  jobs.forEach((j) => j.stop());
  jobs.length = 0;
  logger.info('[scheduler] stopped');
}

module.exports = { startScheduler, stopScheduler };
