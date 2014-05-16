'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var archiver = require('archiver');
var Readable = require('lazystream').Readable;
var utils = require('./utils.js');

module.exports = function(grunt) {

	var zipConfig = {
		options: {
			archive: 'output/static-resources/staticResource.resource',
			mode: 'zip',
			level: 1
		},
		files: [{
			expand: true,
			cwd: 'input/static-resources/',
			src: ['**/*'],
			dest: ''
		}]
	};

	/**
	 * Compress 'inputPath' content in 'outputPath' with 'filename'.'extension'
	 * @param  {String} inputPath: input path
	 * @param  {String} outputPath: path to save the zip file builded
	 * @param  {String} filename: file name
	 * @param  {String} extension: file extension
	 * @param  {Object} done: async done flag
	 * @return {void}
	 */
	exports.compress = function(inputPath, outputPath, filename, extension, done) {

		zipConfig['options'].archive = outputPath + filename + '.' + extension;
		zipConfig['files'][0]['cwd'] = inputPath;

		this.tar(buildFiles(inputPath), done);
	};

	/**
	 * Compress with tar, tgz and zip
	 * @param  {Object} files: files to be processed
	 * @param  {Object} done: async done flag
	 * @return {void}
	 */
	exports.tar = function(files, done) {
		if (typeof zipConfig.options.archive !== 'string' || zipConfig.options.archive.length === 0) {
			grunt.fail.warn('Unable to compress; no valid archive file was specified.');
		}

		var mode = zipConfig.options.mode;
		var shouldGzip = false;
		if (mode === 'tgz') {
			shouldGzip = true;
			mode = 'tar';
		}

		var archive = archiver.create(mode, zipConfig.options);
		var dest = zipConfig.options.archive;

		// Ensure dest folder exists
		grunt.file.mkdir(path.dirname(dest));

		// Where to write the file
		var destStream = fs.createWriteStream(dest);
		var gzipStream;

		archive.on('error', function(err) {
			grunt.log.error(err);
			grunt.fail.warn('Archiving failed.');
		});

		destStream.on('error', function(err) {
			grunt.log.error(err);
			grunt.fail.warn('WriteStream failed.');
		});

		destStream.on('close', function() {
			grunt.log.writeln('Created ' + String(dest).cyan + ' (' + exports.getSize(dest) + ')');
			done();
		});

		if (shouldGzip) {
			gzipStream = zlib.createGzip(zipConfig.options);

			gzipStream.on('error', function(err) {
				grunt.log.error(err);
				grunt.fail.warn('Gziping failed.');
			});

			archive.pipe(gzipStream).pipe(destStream);
		} else {
			archive.pipe(destStream);
		}

		files.forEach(function(file) {
			var isExpandedPair = file.orig.expand || false;
			var src = file.src.filter(function(f) {
				return grunt.file.isFile(f);
			});

			src.forEach(function(srcFile) {
				var internalFileName = (isExpandedPair) ? file.dest : exports.unixifyPath(path.join(file.dest || '', srcFile));
				var srcStream = new Readable(function() {
					return fs.createReadStream(srcFile);
				});

				archive.append(srcStream, {
					name: internalFileName
				}, function(err) {
					if (err) {
						throw err;
					}
					grunt.verbose.writeln('Archiving ' + srcFile.cyan + ' -> ' + String(dest).cyan + '/'.cyan + internalFileName.cyan);
				});
			});
		});
		archive.finalize();
	};

	/**
	 * Returns 'filename' size
	 * @param  {String} filename: file name
	 * @return {Integer}  file size
	 */
	exports.getSize = function(filename) {
		var size = 0;
		if (typeof filename === 'string') {
			try {
				size = fs.statSync(filename).size;
			} catch (e) {}
		} else {
			size = filename;
		}
		return Number(size);
	};

	/**
	 * Returns 'filepath' according the platform
	 * @param  {String} filepath: file name
	 * @return {String} filePath in format win32 or unix
	 */
	exports.unixifyPath = function(filepath) {
		if (process.platform === 'win32') {
			return filepath.replace(/\\/g, '/');
		} else {
			return filepath;
		}
	};

	/**
	 * Builds the files object from 'inputPath'
	 * @param  {String} inputPath: file name
	 * @return {Object} file object
	 */
	var buildFiles = function(inputPath) {
		var files = [];
		var folderArray = [];
		var result = fs.existsSync(inputPath);

		if (result) {
			grunt.file.recurse(inputPath, function(abspath, rootdir, subdir, filename) {

				//Sets subdir to blank if is undefined to allows the user to put static resources in the root folder
				subdir = subdir ? subdir : '';

				if (!utils.isUnixHiddenPath(subdir)) {


					//If the directory was not processed
					if (folderArray.indexOf(subdir) !== 0) {
						folderArray.push(subdir);

						files.push({
							src: [rootdir + subdir],
							dest: subdir,
							orig: {
								expand: zipConfig['files'][0]['expand'],
								cwd: rootdir,
								src: zipConfig['files'][0]['src'],
								dest: zipConfig['files'][0]['dest']
							}
						});
					}

					files.push({
						src: [abspath],
						dest: subdir + '/' + filename,
						orig: {
							expand: zipConfig['files'][0]['expand'],
							cwd: rootdir,
							src: zipConfig['files'][0]['src'],
							dest: zipConfig['files'][0]['dest']
						}
					});
				}
			});
		}
		return files;
	};

	return exports;
};