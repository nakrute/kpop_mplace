const fs = require("node:fs");
const path = require("node:path");

const EMPTY_DATABASE = { users: [], listings: [], requests: [] };

function normalizeDatabase(value) {
  return {
    users: Array.isArray(value?.users) ? value.users : [],
    listings: Array.isArray(value?.listings) ? value.listings : [],
    requests: Array.isArray(value?.requests) ? value.requests : []
  };
}

function createDatabase(file) {
  function read() {
    try {
      return normalizeDatabase(JSON.parse(fs.readFileSync(file, "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      return { ...EMPTY_DATABASE, users: [], listings: [], requests: [] };
    }
  }

  function write(value) {
    const database = normalizeDatabase(value);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporaryFile = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    fs.renameSync(temporaryFile, file);
    return database;
  }

  function update(mutator) {
    const database = read();
    const result = mutator(database);
    write(database);
    return result;
  }

  return { read, update, write };
}

module.exports = { createDatabase };
