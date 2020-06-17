const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const download = require('download');
const compareVersions = require('compare-versions');
const parser = require('./parser');
const common = require('./common');

/**
 * Crawl a given URL
 *
 * @param {string} url url to crawl
 */
const crawl = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.ux-table-metadata');
  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();

  return html;
};

/**
 * Scape the response of the crawled URL
 * Extract the `version` number
 *
 * @param {string} url url to crawl
 */
const getExtensionVersion = async (url) => {
  let version;

  // Try to fetch the latest version from marketplace
  try {
    const response = await crawl(url);
    const $ = cheerio.load(response);
    const infoTable = $('.ux-table-metadata > tbody > tr > td').next(); // Get 2nd td
    version = infoTable.first().text();
  } catch (err) {
    if (err) console.error(err);
    console.error(`Unable to fetch extension version at ${url}`);
  }

  return version;
};

/**
 * Fake a sleep for a specific time period
 *
 * @param {number} ms sleep duration in milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Download file given a URL
 * In the event of `too many request` error, will retry to download again
 * after the reset time based on the `x-ratelimit-reset` field
 *
 * @param {object} extension extension object
 * @param {string} url url to download extension file
 * @param {number} delay delay duration in milliseconds
 * @param {string} directory directory to download to
 */
const startDownload = async (extension, url, delay, directory) => {
  try {
    if (delay > 0) {
      const now = new Date().getTime();
      console.log(`Restarting download of ${extension.name} in ${delay / 1000} seconds at ${new Date(now + delay)}`);
      await sleep(delay);
    }
    console.log(`Starting download from ${url}`);
    await download(url, directory);
  } catch (error) {
    if (error.statusCode === 429) {
      // Due to rate-limiter by visualstudio.com, one cannot have too many request within a timespan
      // Hence, based on the x-ratelimit-reset time, we can restart the download after the reset time
      const now = new Date().getTime();
      const reset = new Date(error.headers['x-ratelimit-reset'] * 1000);
      const delay = (reset - now) + 5000;
      startDownload(extension, url, delay, directory);
    } else {
      console.error(`Unable to download ${JSON.stringify(extension)}`);
      console.error(error);
    }
  }
};

/**
 * Delete outdated extension file(s)
 *
 * @param {object[]} oldExtensions extension object array
 * @param {string} directory directory to remove from
 */
const deleteExtensions = async (oldExtensions, directory) => {
  // Delete outdated extension file(s)
  for (const j in oldExtensions) {
    if (await common.isFileExist(`${directory}/${oldExtensions[j].app}-${oldExtensions[j].version}.vsix`)) {
      fs.unlink(`${directory}/${oldExtensions[j].app}-${oldExtensions[j].version}.vsix`,
        (err) => {
          if (err) console.error(err);
          console.log(`${oldExtensions[j].app}-${oldExtensions[j].version}.vsix deleted`);
        });
    }
  }
};

/**
 * Get a list of extensions by mode
 * Currently supports two mode; `file` and `dir`
 * `file` mode will parse from `extensions.txt` file
 * `dir` mode will parse from `ext` directory
 *
 * @param {string} mode parse based on `file` or `dir` mode
 * @param {string} directory directory to parse from
 */
const getExtensions = async (mode, directory) => {
  let extensions = [];
  (mode === 'file') ? extensions = await parser.parseFile() : extensions = await parser.parseDir(directory);

  return extensions;
};

/**
 * Determine whether a file has a updated version and proceed to
 * download if there is a updated version
 *
 * @param {string} mode parse based on `file` or `dir` mode
 * @param {string} directory directory to check for
 */
const start = async (mode, directory) => {
  const oldExtensions = [];

  const extensions = await getExtensions(mode, directory);
  if (extensions && extensions.length === 0) return;

  for (const i in extensions) {
    // Search for latest version
    const latestVersion = await getExtensionVersion(`https://marketplace.visualstudio.com/items?itemName=${extensions[i].app}`);
    console.log(`${JSON.stringify(extensions[i])}, latest version: ${latestVersion}`);

    // Unable to get latest version for some reason, continue to next extension
    if (latestVersion === undefined) {
      console.error('latestVersion is undefined');
      continue;
    }

    // Otherwise, check if latest version already exist in directory
    const exist = await common.isFileExist(`${directory}/${extensions[i].app}-${latestVersion}.vsix`);

    // Continue to next extension if already have the latest version
    if (exist) continue;

    // Otherwise, try to download the latest version
    const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${extensions[i].publisher}/vsextensions/${extensions[i].name}/${latestVersion}/vspackage`;
    // Running downloads async allow fasten the process
    await startDownload(extensions[i], url, 0, directory);

    // If there is newer version, queue to remove the older version extension file
    if (compareVersions(latestVersion, extensions[i].version) > 0) {
      oldExtensions.push(extensions[i]);
    }
  }

  await deleteExtensions(oldExtensions, directory);
};

start(process.env.MODE, (process.argv[2] || 'ext'));
