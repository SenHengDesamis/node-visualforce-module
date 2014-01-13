"use strict";

var grunt = require("grunt");
var utils = require("./utils.js");
var configuration = require("./configuration.js");
var constants = require("./constants.js");

/**
 * module that buids visualforce pages based on html files
 * @param {object} options configuration object
 * @return {void}
 */
exports.buildPages = function(options) {
  //extensions
  var HTML_EXT = "html";
  var PAGE_EXT = "page";

  var defaultConfiguration = configuration.getConfiguration();
  var replacementConfiguration = configuration.getReplacementConfiguration(options);
  var inputPath = options.inputPath;
  var outputPath = options.outputPath +
                   defaultConfiguration[constants.PAGE_CONFIGURATION_KEY].outputPath;
  var htmlFolder = defaultConfiguration[constants.PATH_CONFIGURATION_KEY].pagesFolder;
  var tagsToReplace = replacementConfiguration[constants.TAGS_REPLACEMENT_KEY];

  grunt.file.recurse("./" + inputPath + htmlFolder, function (abspath, rootdir, subdir, filename) {
    
    var delimiterPos = filename.lastIndexOf(".");
    var extension = filename.substring(delimiterPos + 1, filename.length);
    var dest = grunt.template.process(outputPath + filename.replace("." + HTML_EXT,"." + PAGE_EXT));
    
    if(extension === HTML_EXT){
      //creates a -meta.xml file for filename
      utils.buildXMLMeta(constants.XML_META_PAGE, filename.substring(0, delimiterPos), constants.PAGE_EXTENSION, options.outputPath);
      //creates a .page file for filename and replaces html tags
      var htmlCode = grunt.file.read(abspath);
      for (var tag in tagsToReplace) {
        var tagConfig = tagsToReplace[tag];
        htmlCode = utils.regexReplace(htmlCode, tagConfig);
        grunt.file.write(dest, htmlCode);
      }
    }else{
      //copies the files and creates the output directory (if no exist)
      var newPath = abspath.replace(inputPath + htmlFolder, outputPath);
      
      grunt.file.copy(abspath, newPath);
    }
  });

};
