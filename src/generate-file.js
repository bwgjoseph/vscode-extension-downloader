const parser = require('./parser');
const fs = require('fs');
const { readdirSync } = require('fs')

const getDirectories = (source) =>
  readdirSync((source), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

/**
 * This will generate `extensions.txt` file for each of the subdirectories
 * Default `rootDirectory` is `ext`
 *
 * Usage: npm run generate:ext-file
 *
 * @param {string} rootDirectory
 */
const generateFile = async (rootDirectory = 'ext') => {

    const directories = getDirectories(rootDirectory);

    directories.forEach(async (directory) => {
        const extensions = await parser.parseDir(`${rootDirectory}/${directory}`);

        // convert to christian-kohler.path-intellisense@2.3.0 format
        const fileNames = extensions.map((extension) => `${extension.app}@${extension.version}`);

        // This allows to easily grab the current list and download
        fs.writeFileSync(`${rootDirectory}/${directory}/extensions.txt`, fileNames.join('\n'));

        // Enhancement: to write .bat file using --install
    })
}

generateFile(process.argv[2]);