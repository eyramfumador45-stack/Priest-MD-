/**
 * black_hat/database/miniModel.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * A tiny Sequelize-compatible in-memory model, so black-hat command modules
 * (which call Model.create/findAll/findOne/destroy/update/findOrCreate and
 * instance.save()) run without a Sequelize dependency. PRIEST MD's MongoDB
 * design stays untouched — this store is isolated to the bridge.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

/** Operators supported in `where` clauses (Sequelize Op.* style + $ style). */
const Op = Object.freeze({
  lt: '$lt',
  lte: '$lte',
  gt: '$gt',
  gte: '$gte',
  ne: '$ne',
  eq: '$eq',
  in: '$in',
  like: '$like',
});

const DATA_DIR = path.join(__dirname, '..', '..', '..', '..', '..', 'config', 'blackhat-data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

/** Match a single field value against a where-clause value (supports Op). */
function matchesField(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    const keys = Object.keys(expected);
    if (keys.length === 1 && keys[0].startsWith('$')) {
      const op = keys[0];
      const target = expected[op];
      switch (op) {
        case Op.lt: return actual < target;
        case Op.lte: return actual <= target;
        case Op.gt: return actual > target;
        case Op.gte: return actual >= target;
        case Op.ne: return actual !== target;
        case Op.in: return Array.isArray(target) && target.includes(actual);
        case Op.like: return String(actual).includes(String(target).replace(/%/g, ''));
        case Op.eq: return actual === target;
        default: return false;
      }
    }
    return false;
  }
  if (Array.isArray(expected)) return expected.includes(actual);
  return actual === expected;
}

/** Does a record satisfy a where clause? */
function matchesWhere(record, where = {}) {
  return Object.entries(where).every(([field, expected]) =>
    matchesField(record[field], expected)
  );
}

/** Normalize an order spec: [['field','DESC'], ...] */
function applyOrder(rows, order) {
  if (!Array.isArray(order) || order.length === 0) return rows;
  const [field, dir] = Array.isArray(order[0]) ? order[0] : order;
  const mult = String(dir).toUpperCase() === 'DESC' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult;
    return String(av).localeCompare(String(bv)) * mult;
  });
}

/**
 * Create an in-memory model.
 * @param {string} name model name
 * @param {object} schema field definitions (only used for metadata)
 * @param {object} opts { persist: true } — JSON-file persistence
 */
function createModel(name, schema = {}, opts = {}) {
  const persist = !!opts.persist;
  const file = path.join(DATA_DIR, `${name}.json`);
  let rows = [];
  let nextId = 1;

  if (persist) {
    ensureDir();
    try {
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        rows = data.rows || [];
        nextId = data.nextId || rows.length + 1;
      }
    } catch (e) { /* corrupt file — start fresh */ }
  }

  function save() {
    if (!persist) return;
    ensureDir();
    try {
      fs.writeFileSync(file, JSON.stringify({ rows, nextId }, null, 0));
    } catch (e) { /* non-fatal */ }
  }

  function makeInstance(data) {
    const inst = { ...data };
    if (inst.id === undefined) {
      inst.id = nextId++;
      save();
    }
    inst.save = async () => {
      const idx = rows.findIndex((r) => r.id === inst.id);
      if (idx >= 0) rows[idx] = { ...inst };
      else rows.push({ ...inst });
      save();
      return inst;
    };
    inst.update = async (patch) => {
      Object.assign(inst, patch);
      await inst.save();
      return inst;
    };
    inst.destroy = async () => {
      const before = rows.length;
      rows = rows.filter((r) => r.id !== inst.id);
      save();
      return before - rows.length;
    };
    return inst;
  }

  const Model = {
    name,
    schema,
    rows,
    async sync() { return Model; },
    async create(data) {
      const inst = makeInstance({ ...data });
      rows.push({ ...inst });
      save();
      return inst;
    },
    async findAll({ where, order, limit } = {}) {
      let out = rows.filter((r) => matchesWhere(r, where || {}));
      if (order) out = applyOrder(out, order);
      if (limit) out = out.slice(0, limit);
      return out.map((r) => makeInstance(r));
    },
    async findOne({ where, order } = {}) {
      let out = rows.filter((r) => matchesWhere(r, where || {}));
      if (order) out = applyOrder(out, order);
      return out.length ? makeInstance(out[0]) : null;
    },
    async destroy({ where } = {}) {
      const before = rows.length;
      rows = rows.filter((r) => !matchesWhere(r, where || {}));
      save();
      return before - rows.length;
    },
    async update(data, { where } = {}) {
      let count = 0;
      rows = rows.map((r) => {
        if (matchesWhere(r, where || {})) {
          count++;
          return { ...r, ...data };
        }
        return r;
      });
      save();
      return count;
    },
    async count({ where } = {}) {
      return rows.filter((r) => matchesWhere(r, where || {})).length;
    },
    async findOrCreate({ where, defaults = {} }) {
      const existing = await Model.findOne({ where });
      if (existing) return [existing, false];
      const created = await Model.create({ ...defaults });
      return [created, true];
    },
    _raw() { return rows; },
  };

  return Model;
}

module.exports = {
  createModel,
  Op,
  // Type markers are metadata only (the miniModel does not enforce them),
  // but they must be callable where Sequelize used them as functions (ENUM).
  DataTypes: {
    STRING: 'STRING',
    TEXT: 'TEXT',
    INTEGER: 'INTEGER',
    DATE: 'DATE',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
    NOW: 'NOW',
    ENUM: (...values) => `ENUM(${values.join(',')})`,
  },
};
