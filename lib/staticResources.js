"use strict";

var grunt = require("grunt");
var utils = require("./utils.js");
var constants = require("./constants.js");

/**
 * library that helps to build package.
 * @param {object} options configuration object
 * @param {function} done  async flag
 * @return {void}
 */
exports.buildStaticResources = function(options,done) {
	
	//Get Static Resource Name from configuration object
	var inputPath = options.inputPath;
	var outputPath = options.outputPath;
	var staticResourceName = options.staticResourceName;
	var staticResourceFolder = options.staticResourceFolder;
	
	//Validates if the static resource folder has content to build the .resource and .resource-meta.xml files
	var hasContent = false;

	//If the static resource folder exists
	if ( fs.existsSync('./' + inputPath + staticResourceFolder )){
		//Get the directories
		var staticResources = fs.readdirSync('./' + inputPath + staticResourceFolder);
		var files = [];

		staticResources.some(function(staticResource){
			var stat = fs.statSync('./' + inputPath + staticResourceFolder + staticResource + '/');
			if(stat.isDirectory()){
				files = fs.readdirSync('./' + inputPath + staticResourceFolder + staticResource + '/');
				if(files && files.length > 0){
					hasContent = true;
				}
			}else{
				hasContent = true;
			}

			return hasContent;		
		})
		

		if(hasContent){
			//Compress Static Resources
			var zipper = require('./zipper.js')(grunt);

			zipper.compress(inputPath + staticResourceFolder, outputPath + staticResourceFolder, staticResourceName, 
							constants.STATIC_RESOURCE_EXTENSION, done);

			//Write Static Resource -meta.xml
			utils.buildXMLMeta(constants.XML_META_STATIC_RESOURCE, staticResourceName, constants.STATIC_RESOURCE_EXTENSION, outputPath);
		}else{
			console.log(String('Your ' + inputPath + staticResourceFolder + ' folder is empty, the static resource build will be skipped').cyan);
		}
		
	}else{
		console.log(String('Your ' + inputPath + staticResourceFolder + ' folder was not created, the static resource build will be skipped').cyan);
	}
};