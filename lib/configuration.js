"use strict";

/**
 * function that returns config object
 * @return {object} configuration object
 */
exports.getConfiguration = function(){
	//Default configuration
	var defaultSettings = {
		"path": { // application paths to define output and source files
			//inputPath: source input path, where the src/html and static-resources (css, fonts, img, js) folders needs to be 
			//located
			"inputPath": "input/",
			//outputPath: output folder where the plugin create the *.page files and the static resource file to be deployed on 
			//the configured Salesforce Org
			"outputPath": "output/",
			//staticResourceFolder: folder used on input and output path to store the static resources (this property shouldn't 
			//be changed)
			"staticResourceFolder": "staticresources/",
			//pagesFolder: folder used on input path to store the html pages (this property shouldn't be changed)
			"pagesFolder": "pages/"
		},
		"fileNames": {//application file name configuration
			//staticResourceName: static resource file name (configurable)
			"staticResourceName": "staticResources"
		},
		"page": { // visualforce pages meta xml build configuration
			//metatype: page meta type
			"metaType": "ApexPage",
			//outputPath: folder to store the page meta xml
			"outputPath": "pages/",
			"options": {// page meta configuration items
				//apiVersion: api version to be used by the page
				"apiVersion": "29.0",
				//description: general page description
				"description": "Page upload on Salesforce using Grunt SF Deploy plugin",
				//label: page name 
				"label": "Page Name"
			}
		},
		"package": { // package meta xml build configuration
			//metatype: static resource meta type
			"metaType": "StaticResource",
			//outputPath: folder to store the static resource meta xml
			"outputPath": "staticresources/",
			"options": {//static resource meta configuration items
				//cacheControl: static resource cache control
				"cacheControl": "Public",
				//contentType: static resource content type
				"contentType": "application/zip",
				//description: static resource description 
				"description": "Project Static Resources"
			}
		}
	};
	return defaultSettings;
};

/**
 * Page tags replacement configuration settings
 * @param {object} options configuration object
 * @return {object} configuration replacement object
 */
exports.getReplacementConfiguration = function(options){
	var constants = require("./constants.js");
	var defaultConfiguration = this.getConfiguration();
	var flagsConfiguration = this.getPageFlagsConfiguration();
	var staticResourceName = defaultConfiguration["fileNames"].staticResourceName;

	// generates all the flags for the apex:page tag and set tags by default
	var $flags = "";
	var flagsOptions = (options.apexPageFlags)? options.apexPageFlags : {};
	flagsOptions[constants.SHOW_HEADER_FLAG] = flagsOptions[constants.SHOW_HEADER_FLAG] || false;
	flagsOptions[constants.STANDARD_STYLESHEETS_FLAG] = flagsOptions[constants.STANDARD_STYLESHEETS_FLAG] || false;
	
	Object.keys(flagsOptions).forEach(function(item) {
		if(flagsConfiguration.hasOwnProperty(item)) {
			$flags += " " + item + "=\"" + flagsOptions[item] + "\"";
		}
    });
	var replacementSettings = {
	    "tags": {
			"doctype": {
				"name": "<!DOCTYPE>",
				"regex": /<!DOCTYPE(.*?)>/ig,
				"replacement": ""
			},
			"htmlOpen": {
				"name": "<html>",
				"regex": /<html(.*?)>/ig,
				"replacement": "<apex:page" + $flags + ">"
			},
			"htmlClose": {
				"name": "</html>",
				"regex": /<\/html>/ig,
				"replacement": "</apex:page>"
			},
			"link": {
				"name": "<link>",
				"regex": /<link(.*?)href=["|'](.*?)["|'](.*?)>/ig,
				"replacement": "<apex:stylesheet value='{!URLFOR($Resource." + staticResourceName + ", \"$2\")}'/>"
			},
			"script": {
				"name": "<script>",
				"regex": /<script(.*?)src="(.*?)"(.*?)><\/script>/ig,
				"replacement": "<apex:includeScript value='{!URLFOR($Resource." + staticResourceName + ", \"$2\")}'/>"
			},
			"imgClass": { //replace for img class
				"name": "<img>",
				"regex": /<img(.*?)class=["|'](.*?)["|'](.*?)\/>/ig,
				"replacement": "<img$1styleClass='$2'$3/>"
			},
			"img": { //replace for img tags
				"name": "<img>",
				"regex": /<img(.*?)src=["|'](.*?)["|'](.*?)\/>/ig,
				"replacement": "<img$1src='{!URLFOR($Resource." + staticResourceName + ", \"$2\")}'$3/>"
			}
		}
	};
    return replacementSettings;
};

/**
 * Apex Page flags configuration settings
 * @return {object} apex page flags configuration object
 */
exports.getPageFlagsConfiguration = function(){
	var apexPageFlags = {
		"action": "{!doAction}",
		"apiVersion": "29.0",
		"applyBodyTag": false,
		"applyHtmlTag": false,
		"cache": false,
		"contentType": "text/html",
		"controller": "",
		"deferLastCommandUntilReady": false,
		"docType": "html-5.0",
		"expires": "600",
		"extensions": "",
		"id": "",
		"label": "",
		"language": "",
		"manifest": "",
		"name": "",
		"pageStyle": "",
		"readOnly": false,
		"recordSetName": "",
		"recordSetVar": "",
		"renderAs": "",
		"rendered": false,
		"setup": false,
		"showChat": false,
		"showHeader": false,
		"sidebar": false,
		"standardController": "",
		"standardStylesheets": false,
		"tabStyle": "",
		"title": "",
		"wizard": false
	};
    return apexPageFlags;
};