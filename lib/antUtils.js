'use strict'

var path     = require('path'),
	metadata = require('./metadata.json'),
	localTmp = path.resolve(__dirname, '../tmp'),
	localLib = path.resolve(__dirname, '../deps'),
	exec = require('child_process').exec;

module.exports = function(grunt){

	/**
	 * Function that seeks for the metadata
	 * @param  {string} key definition
	 * @return {void}     
	 */
	function lookupMetadata(key) {
	    key = key.toLowerCase();
	    var typeName;
	    // try to match on metadata type
	    if(metadata[key] && metadata[key].xmlType) {        
	        typeName = metadata[key].xmlType;
	    } else {
	        // try to match on folder
	        Object.keys(metadata).forEach(function(mk) {
	            var folder = metadata[mk].folder;
	            if(typeof folder === 'string' && folder.toLowerCase() === key) {
	                typeName = metadata[mk].xmlType;
	            } else if(key === 'documents') {
	                typeName = metadata['document'].xmlType;
	            } else if(key === 'emails') {
	                typeName = metadata['email'].xmlType;
	            } else if(key === 'reports') {
	                typeName = metadata['report'].xmlType;
	            } else if(key === 'dashboards') {
	                typeName = metadata['dashboard'].xmlType;
	            }
	        });
	    }
	    return typeName;
	}

	/**
	 * function that clears the deployment folder structure.
	 * @return {void}
	 */
	exports.clearLocalTmp = function() {
	    if(grunt.file.exists(localTmp)) {
	        grunt.file.delete(localTmp, { force: true });
	    }
	}

	/**
	 * function that creates the directories for deployment
	 * @return {void} 
	 */
	exports.makeLocalTmp = function() {
	    this.clearLocalTmp();
	    grunt.file.mkdir(localTmp);
	    grunt.file.mkdir(localTmp + '/ant');
	}

	/**
	 * function that pase if the auth params comes from command line and set them
	 * on options object
	 * @param  {object} options configuration object
	 * @param  {string} target  deployment org
	 * @return {void}           
	 */
	exports.parseAuth = function(options, target) {
	    var un = (!options.useEnv) ? options.user  : process.env.SFUSER,
	    	pw = (!options.useEnv) ? options.pass  : process.env.SFPASS,
	    	tk = (!options.useEnv) ? options.token : process.env.SFTOKEN;
	    if(tk){ pw += tk; }
	    if(!un) { grunt.log.error('no username specified for ' + target); }
	    if(!pw) { grunt.log.error('no password specified for ' + target); }
	    if(!un || !pw){ grunt.fail.warn('username/password error'); }
	    options.user = un;
	    options.pass = pw;
	    if(options.useEnv && process.env.SFSERVERURL) {
	        options.serverurl = process.env.SFSERVERURL;
	    }
	    grunt.log.writeln('User -> ' + options.user.green);
	}

	/**
	 * function that runs ant task
	 * @param  {string}   task   ant task label
	 * @param  {string}   target notification text
	 * @param  {Function} done   async function
	 * @return {void}            
	 */
	exports.runAnt = function(task, target, done) {
		// Patch by Nicholas Kircher (https://github.com/MiracleBlue)
		// Using grunt.util.spawn can't find ANT on OS X 10.9 for some reason
		// Replaced with node's standard child_process
		var args =  [
			'-buildfile',
				localTmp + '/ant/build.xml',
			'-lib',
			localLib,
				'-Dbasedir='     + process.cwd()
		];
		args.push(task);
		grunt.log.debug('ANT CMD: ant ' + args.join(' '));
		grunt.log.writeln('Starting ANT ' + task + '...');

		var cp = exec('ant ' + args.join(" "), function (err, stdout, stderr) {
			console.log("halp", stdout, err);
			done(err, stdout);
		});
		// End patch
	}

	/**
	 * function that build the package xml to deploy resources
	 * @param  {object} pkg     meta-data objecte
	 * @param  {string} version saleforce api version
	 * @return {array}          array whith xml
	 */
	exports.buildPackageXml = function(pkg, version) {
	    var packageXml = [
	        '<?xml version="1.0" encoding="UTF-8"?>',
	        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'
	    ];
	    if(pkg) {
	        Object.keys(pkg).forEach(function(key) {
	            var type = pkg[key];
	            var typeName = lookupMetadata(key);
	            if(!typeName) { grunt.fail.fatal(key + ' is not a valid metadata type'); }
	            packageXml.push('    <types>');
	            type.forEach(function(t) {
	                packageXml.push('        <members>' + t + '</members>');
	            });
	            packageXml.push('        <name>' + typeName + '</name>');
	            packageXml.push('    </types>');
	        });
	    }
	    packageXml.push('    <version>' + version + '</version>');
	    packageXml.push('</Package>');
	    return packageXml.join('\n');
	}	

	return exports;
}