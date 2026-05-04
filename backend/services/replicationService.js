const db = require('../db');

const SOURCE_DB = process.env.REPLICATION_SOURCE_DB || 'speedjardist';
const TARGET_DB = process.env.REPLICATION_TARGET_DB || process.env.DB_NAME || 'hsse_dashboard_pelaporan_pengawasan';

const TABLES = [
  { name: 'dc_apj', key: 'APJ_ID' },
  { name: 'dc_upj', key: 'UPJ_ID' },
];

function qid(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function tableName(schema, table) {
  return `${qid(schema)}.${qid(table)}`;
}

async function getColumns(schema, table) {
  const [rows] = await db.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `,
    [schema, table]
  );
  return rows.map(row => row.COLUMN_NAME);
}

function sameColumns(sourceColumns, targetColumns) {
  const targetSet = new Set(targetColumns);
  return sourceColumns.filter(column => targetSet.has(column));
}

async function rowExists(conn, target, keyColumn, keyValue) {
  const [rows] = await conn.query(
    `SELECT 1 FROM ${target} WHERE ${qid(keyColumn)} = ? LIMIT 1`,
    [keyValue]
  );
  return rows.length > 0;
}

async function replicateTable(conn, tableConfig) {
  const { name, key } = tableConfig;
  const source = tableName(SOURCE_DB, name);
  const target = tableName(TARGET_DB, name);

  const [sourceColumns, targetColumns] = await Promise.all([
    getColumns(SOURCE_DB, name),
    getColumns(TARGET_DB, name),
  ]);
  const columns = sameColumns(sourceColumns, targetColumns);

  if (!columns.includes(key)) {
    throw new Error(`Kolom key ${key} tidak ditemukan pada ${SOURCE_DB}.${name} atau ${TARGET_DB}.${name}`);
  }

  const [sourceRows] = await conn.query(
    `SELECT ${columns.map(qid).join(', ')} FROM ${source}`
  );

  const updateColumns = columns.filter(column => column !== key);
  const setSql = updateColumns.map(column => `${qid(column)} = ?`).join(', ');
  const diffSql = updateColumns.map(column => `NOT (${qid(column)} <=> ?)`).join(' OR ');
  const insertSql = `
    INSERT INTO ${target} (${columns.map(qid).join(', ')})
    VALUES (${columns.map(() => '?').join(', ')})
  `;

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const row of sourceRows) {
    const keyValue = row[key];
    const updateValues = updateColumns.map(column => row[column]);
    const diffValues = updateColumns.map(column => row[column]);

    const [updateResult] = await conn.query(
      `
        UPDATE ${target}
        SET ${setSql}
        WHERE ${qid(key)} = ?
          AND (${diffSql})
      `,
      [...updateValues, keyValue, ...diffValues]
    );

    if (updateResult.affectedRows > 0) {
      updated += updateResult.affectedRows;
      continue;
    }

    const exists = await rowExists(conn, target, key, keyValue);
    if (exists) {
      unchanged += 1;
      continue;
    }

    await conn.query(insertSql, columns.map(column => row[column]));
    inserted += 1;
  }

  return {
    table: name,
    key,
    sourceRows: sourceRows.length,
    inserted,
    updated,
    unchanged,
  };
}

async function replicateAllTables() {
  const conn = await db.getConnection();
  const startedAt = new Date();

  try {
    await conn.beginTransaction();

    const tables = [];
    for (const tableConfig of TABLES) {
      tables.push(await replicateTable(conn, tableConfig));
    }

    await conn.commit();

    return {
      success: true,
      sourceDb: SOURCE_DB,
      targetDb: TARGET_DB,
      startedAt,
      finishedAt: new Date(),
      tables,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  replicateAllTables,
  replicateTable,
  TABLES,
};
