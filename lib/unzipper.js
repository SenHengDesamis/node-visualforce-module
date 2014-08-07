'use strict'

var grunt = require('grunt'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils.js'),
    DecompressZip = require('decompress-zip'),
    localTmp = path.resolve(__dirname, '../tmp');

/**
 * Decompress static resource item
 * @param  {String}   input           [description]
 * @param  {String}   output          [description]
 * @param  {Array}   staticResources [description]
 * @param  {Integer}   index           [description]
 * @param  {Function} callback        [description]
 */
function unzipResources(input, output, staticResources, index, callback){   
  var filename = staticResources[index],
  archive = input + filename,
  name = filename.split('.');

  var unzipper = new DecompressZip(archive)

  //Error listener
  unzipper.on('error', function (err) {
    grunt.log.writeln(String('Error decompressing ' + filename).red);
  });

  //Decompress completion listener
  unzipper.on('extract', function (log) {
    grunt.log.writeln(String('Finished extracting ' + name[0]).cyan);

    //Bind callback to decompress the next item in staticResources after 100 milliseconds
    setTimeout(callback.bind(null, staticResources, index + 1), 100);
  });

  //Decompress the file located on 'archive'
  unzipper.extract({
    path: output + name[0],
    filter: function (file) {
      return file.type !== "SymbolicLink";
    }
  });
}

/**
* Decompress StaticResources files from 'output' in the folder 'output' using the static resource 
* name as the name of the folder where the resources will be stored
* @param  {String}   input           [input folder path]
* @param  {String}   output          [ouput folder path]
* @param  {Array]   staticResources  [StaticResources to be decompressed]
* @param  {Function} done            [Callback]
*/
exports.unzipStaticResources = function(input, output, staticResources, done){
  var index = 0;
  var length = staticResources.length;

	//Decompress each of the static resources files contained on 'staticResources'
	//staticResources: array containing the StaticResources to be decompressed
	//index: array index to be processed in unzip
  	(function unzip(staticResources, index) {   
  	  if (index < length) {
  	    //Unzip StaticResources item (unzip is defined as a callback to re-execute the method after the item is 
  	    //decompressed)
  	    unzipResources(input, output, staticResources, index, unzip);           
  	  }else{
  	    grunt.log.writeln(String('All Static Resources retrieved from org were decompressed').cyan);  

  	    //Clear tmp folder      
  	    utils.clearSpecifiedFolder(localTmp);

  	    //Excecute main callback
  	    done();
  	  }
	})(staticResources, index); 
}

/**
* Filter StaticResources array returning only the .resource files filtering any other file/folder stored in 
* the array 
* @param  {Array} staticResources [Array to be filterd]
* @return {Array}                 [Filterd array including only the .reource files]
*/
exports.filterStaticResources = function(staticResources) {

	var result = staticResources.filter(function(item){
	  var filename = item.split('.');
	  if(filename[filename.length - 1] === 'resource') {
	    return true;
	  }
	}); 

	return result;
}    