const fs = require('fs');
const compareVersions = require('compare-versions');
const parser = require('./parser');
const common = require('./common');


/**
 * Read from target directory, check if newer version exist in source directory
 * Copy newer version if exist
 *
 * @param {string} target target directory
 * @param {string} source source directory
 */
const updater = async (target, source = 'ext') => {
  if (!(await common.isFileExist(target))) return;

  const fullExtensions = await parser.parseDir(source);
  const extensions = await parser.parseDir(target);

  // Read from directory
  // Put into same object
  // Foreach the list of extension in directory against the full extension directory
  // Compare the version
  // If higher version, copy into it, and delete the older version
  extensions.forEach(extension => {
    const match = fullExtensions.find((f) => {
      return f.name === extension.name;
    });

    if (match) {
      if (compareVersions(match.version, extension.version) > 0) {
        fs.copyFile(`${source}/${match.app}-${match.version}.vsix`, `${target}/${match.app}-${match.version}.vsix`, (err) => {
          if (err) throw err;
          console.log(`${match.app}-${match.version}.vsix copied`);
          fs.unlink(`${target}/${extension.app}-${extension.version}.vsix`,
            (err) => {
              if (err) console.error(err);
              console.log(`${extension.app}-${extension.version}.vsix deleted`);
            }
          );
        });
      }
    }
  });
}

if (!process.argv[2]) {
  throw new Error('Target directory not specified');
}

updater(process.argv[2], process.argv[3]);
