const fs = require('fs');

/**
 * Based on a given filepath, determine if a file exist
 *
 * @param {string} path filepath
 */
const isFileExist = path => new Promise(resolve => fs.access(path, fs.F_OK, (err) => resolve(!err)));

module.exports = {
  isFileExist
}