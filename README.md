`vscode-extension-downloader` let you
- Generate a list of `vscode` extensions on your local machine then export it to a file. See `npm run generate`
- Using the file, it can download extension automatically. See `npm run download:file`
- It can also update your list of extension to the latest version automatically. See `npm run download:dir`
- Compare and updates extension. See `npm run updater`

Downloads happens asynchronously, and will auto restart to download when it hits `ratelimit` set by vsc marketplace.
Older version of the extension file will be purged after newer version has been downloaded.

## Available Scripts

In the project directory, you can run:

### `npm run generate`

Generates a list of extensions from visual studio code and output to a file

### `npm run generate:ext-file [rootDirectory]`

Generates `extensions.txt` file for each of the subdirectories based on the `vsix` file within each directory

Default root directory is `ext` if not specified

### `npm run download:file`

Uses the list of extensions generated from `npm run prepare` to check against visual studio code marketplace for any newer version and download the extension to `ext` directory.

This is useful mostly for first time where it requires to download a entire list of extensions or update with a updated list of extension

### `npm run download:dir [directory]`

Uses the list of extensions from a local directory to check against visual studio code marketplace for any newer version and download the extension to `ext` directory.

This should be the default when checking for updates.

Default `directory` is `ext`.

### `npm run updater target [source]`

Update extension(s) from `source` directory to `target` directory by comparing the files version.
If `source` has a higher version of the same extension as the one in `target`, then move and delete older extension.

Default `source` directory is `ext`.

Overlaps with `download:dir`