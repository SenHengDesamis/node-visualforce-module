'use strict';

var grunt = require('grunt'),
	utils = require('./utils.js'),
	constants = require('./constants.js'),
	zipper = require('./zipper.js')(grunt),
	fs = require('fs'),
	numberOfStaticResources = 0,
	zippedFiles = 0,
	done_func;

/**
 * callback function that executes when zip process is complete
 * for every single folder
 * @return {void}
 */
function zipComplete () {
	zippedFiles++;

	if (zippedFiles === numberOfStaticResources) {
		done_func();
	}
}

/**
 * library that helps to build package.
 * @param {object} options configuration object
 * @param {function} done  async flag
 * @return {void}
 */
exports.buildStaticResources = function(options, done) {

	//Get Static Resource Name from configuration object
	var staticResourceFolder = options.staticResourceFolder,
		inputPath = options.inputPath + staticResourceFolder,
		outputPath = options.outputPath;

	//asign main callback
	done_func = done;

	//Validates if the static resource folder has content to build the .resource and .resource-meta.xml files
	var hasContent = false;

	//If the static resource folder exists
	if (fs.existsSync('./' + inputPath)) {

		//Get the directories
		var staticResources = fs.readdirSync('./' + inputPath),
			files = [],
			resources = [],
			path;

		//number of folders to compress
		numberOfStaticResources = staticResources.length;

		staticResources.forEach(function(staticResourceName) {
			//path
			path = './' + inputPath + staticResourceName + '/';

			//Retrieves all the files/directories contained on 'staticResourceName' folder
			resources = fs.readdirSync(path);

			resources.some(function(staticResource) {

				// Patch by Nicholas Kircher (https://github.com/MiracleBlue)
				// Prevents code breaking on .DS_Store file (thinks its a directory when it isn't)
				// todo: Make this more ambiguous so that any other potential weird files are also caught
				if (staticResource === '.DS_Store') {
					numberOfStaticResources--;
					return;
				}
				// End patch

				var stat = fs.statSync(path + staticResource + '/');

				if (stat.isDirectory()) {
					files = fs.readdirSync(path + staticResource + '/');

					if (files && files.length > 0) {
						hasContent = true;
					}
				} else {
					hasContent = true;
				}

				return hasContent;
			});

			//Creates a zip only if the folder 'staticResourceName' contains files
			if (hasContent) {
				//Compress Static Resources
				zipper.compress(inputPath + staticResourceName, outputPath + staticResourceFolder, staticResourceName,
					constants.STATIC_RESOURCE_EXTENSION, zipComplete);
				//Write Static Resource -meta.xml
				utils.buildXMLMeta(constants.XML_META_STATIC_RESOURCE, staticResourceName, constants.STATIC_RESOURCE_EXTENSION, outputPath);
			} else {
				numberOfStaticResources--;
				console.log(String('Your ' + inputPath + ' folder is empty, the static resource build will be skipped').cyan);
			}

		});

	} else {
		console.log(String('Your ' + inputPath + ' folder was not created, the static resource build will be skipped').cyan);
	}
};