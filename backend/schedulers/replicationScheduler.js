const { replicateAllTables } = require('../services/replicationService');

const DEFAULT_RUN_AT = '23:00';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let timer = null;
let running = false;

function parseRunAt(value) {
  const raw = value || DEFAULT_RUN_AT;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw);
  if (!match) {
    console.warn(`[REPLICATION] REPLICATION_RUN_AT tidak valid: "${raw}". Fallback ke ${DEFAULT_RUN_AT}.`);
    return parseRunAt(DEFAULT_RUN_AT);
  }
  return { hour: Number(match[1]), minute: Number(match[2]), raw };
}

function nextRunDate(now = new Date(), runAt = parseRunAt(process.env.REPLICATION_RUN_AT)) {
  const next = new Date(now);
  next.setHours(runAt.hour, runAt.minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function runReplication(reason = 'scheduled') {
  if (running) {
    console.warn(`[REPLICATION] Skip ${reason}: proses replikasi sebelumnya masih berjalan.`);
    return;
  }

  running = true;
  console.log(`[REPLICATION] Mulai (${reason}) ${new Date().toISOString()}`);

  try {
    const result = await replicateAllTables();
    console.log('[REPLICATION] Selesai', JSON.stringify(result));
  } catch (error) {
    console.error('[REPLICATION] Gagal', error);
  } finally {
    running = false;
  }
}

function scheduleNextRun() {
  if (process.env.REPLICATION_ENABLED === 'false') {
    console.log('[REPLICATION] Scheduler nonaktif (REPLICATION_ENABLED=false).');
    return;
  }

  const runAt = parseRunAt(process.env.REPLICATION_RUN_AT);
  const next = nextRunDate(new Date(), runAt);
  const delay = next.getTime() - Date.now();

  console.log(`[REPLICATION] Scheduler aktif. Run berikutnya: ${next.toLocaleString('id-ID')} (${runAt.raw} waktu server).`);

  timer = setTimeout(async () => {
    await runReplication('scheduled');
    scheduleNextRun();
  }, delay);
}

function startReplicationScheduler() {
  if (timer) return;

  scheduleNextRun();

  if (process.env.REPLICATION_RUN_ON_START === 'true') {
    setTimeout(() => runReplication('startup'), 5000);
  }
}

function stopReplicationScheduler() {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
}

startReplicationScheduler();

module.exports = {
  runReplication,
  startReplicationScheduler,
  stopReplicationScheduler,
  nextRunDate,
  ONE_DAY_MS,
};
