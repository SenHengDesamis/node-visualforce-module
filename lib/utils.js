'use strict';

var grunt = require('grunt');
var configuration = require('./configuration.js');
var fs = require('fs');

/**
 * funciton that counts the elements of an object
 * @param  {object} obj     object to count
 * @return {integer} size   number of elements
 */
exports.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * function that builds the meta-data files
 * @param  {string} type     config type
 * @param  {string} fileName string with filename
 * @param  {string} outputDir output folder
 * @return {void}
 */
exports.buildXMLMeta = function(type, fileName, extension, outputDir) {
	var defaultConfiguration = configuration.getConfiguration();
	var metaType = defaultConfiguration[type].metaType;
	var outputPath = outputDir + defaultConfiguration[type].outputPath;
  var options = defaultConfiguration[type].options;

  var LABEL = 'label';
  
  var packageXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<'+ metaType +' xmlns="http://soap.sforce.com/2006/04/metadata">'
  ];

  if(options) {
    Object.keys(options).forEach(function(key) {
      packageXml.push('    <' + key + '>' + (key === LABEL?fileName:options[key]) + '</' + key + '>');
    });
  }
  var dest = grunt.template.process(outputPath + fileName + '.' + extension) + '-meta.xml';
  packageXml.push('</'+ metaType +'>');
  grunt.file.write(dest, packageXml.join('\n'));
};

/**
 * function that replaces a src file using regex
 * @param  {string} src       src string to be replaced
 * @param  {object} tagConfig tag configuration object:
 *                          - regex: regular expresion to search
 *                          - replacement: string to use as a replacement
 *                          - name: string to use for log actions
 * @return {string} modified string          
 */
exports.regexReplace = function(src, tagConfig) {
  return String(src).replace(tagConfig.regex, tagConfig.replacement);
};

/**
 * Validates the input Folder Structure, considering valid a input/pages folder or input/pages and input/staticresources folder
 * @param  {Array} options
 * @return {Boolean} retunr true if input/pages folder exist or input/pages and input/staticresources folder exists
 */
exports.inputFolderStructureIsValid = function(options){
  var isValid = false;

  var defaultConfiguration = configuration.getConfiguration();

  //Validates input path folders
  var inputPathPageExist = fs.existsSync('./' + options.inputPath +  defaultConfiguration.path.pagesFolder);
  var inputPathStaticResourcesExist =fs.existsSync('./' + options.inputPath +  defaultConfiguration.path.staticResourceFolder);
  isValid = inputPathPageExist || (inputPathPageExist && inputPathStaticResourcesExist);

  return isValid;
}

/**
 * Creates input structure
 * @return {void}
 */
exports.createInputStructure = function(options){
  var defaultConfiguration = configuration.getConfiguration();
  
  //If input put does not exists
  if ( !fs.existsSync('./' + options.inputPath )) {
    //Creates inputPath
    fs.mkdirSync(options.inputPath, "0777");
  }

  //If pages folder does not exists
  if ( !fs.existsSync('./' + options.inputPath + defaultConfiguration.path.pagesFolder )) {
    //Creates pages folder
    fs.mkdirSync(options.inputPath + defaultConfiguration.path.pagesFolder + '/', "0777");
  }

  //If staticresources folder does not exists
  if ( !fs.existsSync('./' + options.inputPath + defaultConfiguration.path.staticResourceFolder )) {
    //Creates staticresources folder
    fs.mkdirSync(options.inputPath + defaultConfiguration.path.staticResourceFolder + '/', "0777");
  }
}

//checks unix hidden path.
exports.isUnixHiddenPath = function (argument) {
  return (/(^|.\/)\.+[^\/\.]/g).test(argument);
}