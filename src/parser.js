const fs = require('fs');
const util = require('util');

fs.readFileAsync = util.promisify(fs.readFile);
fs.readDirAsync = util.promisify(fs.readdir);

/**
 * Parse a list of extension reside in the given directory
 *
 * @param {string} directory directory to parse
 */
const parseDir = async (directory) => {
  console.log('parse by directory: ', directory);
  let extensions = [];

  try {
    let files = await fs.readDirAsync(directory);
    // Grab only files with .vsix extension
    files = files.filter((f) => f.includes('.vsix'));

    files.map(extension => {
      // '2gua.rainbow-brackets-0.0.6.vsix'
      const lastIndexOfDash = extension.lastIndexOf('-');
      const lastIndexOfDot = extension.lastIndexOf('.');
      const firstIndexOfDot = extension.indexOf('.');

      const app = extension.substring(0, lastIndexOfDash);
      const publisher = extension.substring(0, firstIndexOfDot);
      const name = app.split('.');
      const version = extension.substring(lastIndexOfDash + 1, lastIndexOfDot);

      extensions.push({
        app,
        publisher,
        name: name[1],
        version,
      });
    });
  } catch (err) {
    if (err) console.error(err);
  }

  return extensions;
};

/**
 * Parse a list of extension reside in the `extensions.txt` file
 * Default `directory` is `.`
 *
 * @param {string} directory directory to parse
 */
const parseFile = async (directory = '.') => {
  console.log('parse by file');
  console.log('parsing directory: ', directory);
  let extensions = [];

  try {
    const data = await fs.readFileAsync(`${directory}/extensions.txt`, 'utf8');
    const lines = data.toString().split("\n");

    lines.map(line => {
      // 2gua.rainbow-brackets@0.0.6
      if (!line) {
        return null;
      }

      const app = line.split(/[@]/, 2);
      const publisher = app[0].split('.');

      extensions.push({
        app: app[0],
        publisher: publisher[0],
        name: publisher[1],
        version: app[1],
      });
    });
  } catch (err) {
    if (err) console.error(err);
    console.error('Ensure extensions.txt exist in root directory or run npm run generate to generate extensions.txt');
  }

  return extensions;
};

module.exports = {
  parseDir,
  parseFile
}
