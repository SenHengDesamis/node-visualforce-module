'use strict';
var grunt = require('grunt');
var path = require('path');
var utils = require('./lib/utils');
var fs = require('fs');
var antUtils = require('./lib/antUtils')(grunt);
var unzipper = require('./lib/unzipper');
var page = require('./lib/page.js');
var staticResources = require('./lib/staticResources.js');
var conf = require('./lib/configuration').getConfiguration();
var metadata = require('./lib/metadata.json');
var localTmp = path.resolve(__dirname, './tmp');
var localAnt = path.resolve(__dirname, './ant');
var localLib = path.resolve(__dirname, './deps');

/**
 * class that represents the build process
 * @param  {object} options options object
 * @return {object}         instance of build class
 */
exports.build = function(options) {

  //create the internal config object
  var configOptions = {};

  var init = function(options) {

    configOptions = {
      inputPath: conf.path.inputPath,
      outputPath: conf.path.outputPath,
      staticResourceFolder: conf.path.staticResourceFolder
    };

    //verifies the option object content
    if (utils.size(options) > 0) {

      //checks the configuration values
      if ((typeof options.inputPath) == 'string' && options.inputPath.length > 0) {
        configOptions.inputPath = options.inputPath;
      }

      if ((typeof options.outputPath) == 'string' && options.outputPath.length > 0) {
        configOptions.outputPath = options.outputPath;
      }

      if ((typeof options.staticResourceFolder) == 'string' && options.staticResourceFolder.length > 0) {
        configOptions.staticResourceFolder = options.staticResourceFolder;
      }

    } 
  };

  //executes the contructor method
  init(options);

  return {
    /**
     * method that return config options
     * @return {object} config object
     */
    getConfig: function() {
      return configOptions;
    },
    /**
     * method that executes the build task
     * @param {function} callback callback function
     * @return {void}
     */
    execute: function(callback) {

      if (utils.inputFolderStructureIsValid(this.getConfig())) {

        page.buildPages(this.getConfig());
        staticResources.buildStaticResources(this.getConfig(), callback);

      } else {
        //Creates input structure
        utils.createInputStructure(this.getConfig());

        //Informs to the user
        console.log(String('The input structure was missing, we created it for you').cyan);
        console.log(String('Please refer to the README file to know how to use it').cyan);
      }
    }
  };
};


/**
 * class that represents the deploy process
 * @param  {object} options configuration object
 * @return {void}
 */
exports.deploy = function(options) {

  var configOptions = {};
  var template = false;
  
  /**
   * constructor method
   * @param  {object} options configuration object
   * @return {void}
   */
  var init = function(options) {
    antUtils.makeLocalTmp();

    configOptions = {
      target: 'default',
      user: false,
      pass: false,
      token: false,
      root: conf.path.outputPath,
      apiVersion: conf.page.options.apiVersion,
      serverurl: conf.serverUrl,
      pollWaitMillis: 10000,
      maxPoll: 20,
      checkOnly: false,
      runAllTests: false,
      rollbackOnError: true,
      useEnv: false
    };

    if (utils.size(options) > 0) {

      if (options.hasOwnProperty('proxyConfig')) {
        configOptions.proxyConfig = options.proxyConfig;
        template = grunt.file.read(localAnt + '/antdeploy.build.proxy.xml');
      } else {
        template = grunt.file.read(localAnt + '/antdeploy.build.xml');
      }

      if ((typeof options.target) == 'string' && options.target.length > 0) {
        configOptions.target = options.target;
      }

      if ((typeof options.user) == 'string' && options.user.length > 0) {
        configOptions.user = options.user;
      }

      if ((typeof options.pass) == 'string' && options.pass.length > 0) {
        configOptions.pass = options.pass;
      }

      if ((typeof options.token) == 'string' && options.token.length > 0) {
        configOptions.token = options.token;
      }

      if ((typeof options.apiVersion) == 'string' && options.apiVersion.length > 0) {
        configOptions.apiVersion = options.apiVersion;
      }

      if ((typeof options.serverurl) == 'string' && options.serverurl.length > 0) {
        configOptions.serverurl = options.serverurl;
      }

      if ((typeof options.outputPath) == 'string' && options.outputPath.length > 0) {
        configOptions.root = options.outputPath;
      }

    } else {
      template = grunt.file.read(localAnt + '/antdeploy.build.xml');
    }

    if (utils.size(options.pkg) > 0) {
      configOptions.pkg = options.pkg;
    } else {
      throw 'pkg attribute is not defined';
    }
  };

  //executes contructor method
  init(options);


  return {
    /**
     * method that return config options
     * @return {object} config object
     */
    getConfig: function() {
      return configOptions;
    },
    /**
     * method that executes the build task
     * @return {void}
     */
    execute: function() {

      grunt.log.writeln('Deploy Target -> ' + this.getConfig().target);
      antUtils.parseAuth(this.getConfig(), this.getConfig().target);

      this.getConfig().tests = [];
      var buildFile = grunt.template.process(template, {
        data: this.getConfig()
      });
     
      grunt.file.write(localTmp + '/ant/build.xml', buildFile);
 
      var packageXml = antUtils.buildPackageXml(this.getConfig().pkg, this.getConfig().apiVersion);
      grunt.file.write(this.getConfig().root + '/package.xml', packageXml);

      antUtils.runAnt('deploy', this.getConfig().target, function(err, result) {
        antUtils.clearLocalTmp();
      });
    },
    /**
     * method to undeploy project from salesforce.com
     * @return {void}
     */
    destroy: function() {
      antUtils.makeLocalTmp();

      var template = grunt.file.read(localAnt + '/antdeploy.build.xml');

      grunt.log.writeln('Destroy Target -> ' + this.getConfig().target);
      antUtils.parseAuth(this.getConfig(), this.getConfig().target);

      this.getConfig().tests = [];
      var buildFile = grunt.template.process(template, {
        data: this.getConfig()
      });
      grunt.file.write(localTmp + '/ant/build.xml', buildFile);

      var packageXml = antUtils.buildPackageXml(null, this.getConfig().apiVersion);
      grunt.file.write(this.getConfig().root + '/package.xml', packageXml);

      var destructiveXml = antUtils.buildPackageXml(this.getConfig().pkg, this.getConfig().apiVersion);
      grunt.file.write(this.getConfig().root + '/destructiveChanges.xml', destructiveXml);

      antUtils.runAnt('deploy', this.getConfig().target, function(err, result) {
        antUtils.clearLocalTmp();
      });
    }    
  };
};

/**
 * class that represents the retrieve process
 * @param  {object} options configuration object
 * @return {void}
 */
exports.retrieve = function(options) {

  var configOptions = {};
  var template = false;

  /**
   * constructor method
   * @param  {object} options configuration object
   * @return {void}
   */
  var init = function(options) {
    antUtils.makeLocalTmp();

    configOptions = {
      target: 'default',
      user: false,
      pass: false,
      token: false,
      root: localTmp,
      apiVersion: conf.page.options.apiVersion,
      serverurl: conf.serverUrl,
      pollWaitMillis: 10000,
      maxPoll: 20,
      retrieveTarget: false,
      unzip: true,
      existingPackage: false,
      inputPath: conf.path.inputPath,
      outputPath: conf.path.outputPath,
      staticResourceFolder: conf.path.staticResourceFolder
    };

    if (utils.size(options) > 0) {

      if (options.hasOwnProperty('proxyConfig')) {
        configOptions.proxyConfig = options.proxyConfig;
        template = grunt.file.read(localAnt + '/antretrieve.build.proxy.xml');
      } else {
        template = grunt.file.read(localAnt + '/antretrieve.build.xml');
      }

      if ((typeof options.target) == 'string' && options.target.length > 0) {
        configOptions.target = options.target;
      }

      if ((typeof options.user) == 'string' && options.user.length > 0) {
        configOptions.user = options.user;
      }else{
        grunt.log.writeln(String('Username not defined').red);
      }

      if ((typeof options.pass) == 'string' && options.pass.length > 0) {
        configOptions.pass = options.pass;
      }else{
        grunt.log.writeln(String('Password not defined').red);
      }

      if ((typeof options.token) == 'string' && options.token.length > 0) {
        configOptions.pass += options.token;
      }else{
        grunt.log.writeln(String('Token not defined').red);
      }

      if ((typeof options.apiVersion) == 'string' && options.apiVersion.length > 0) {
        configOptions.apiVersion = options.apiVersion;
      }

      if ((typeof options.serverurl) == 'string' && options.serverurl.length > 0) {
        configOptions.serverurl = options.serverurl;
      }
      
      if ((typeof options.inputPath) == 'string' && options.inputPath.length > 0) {
        configOptions.inputPath = options.inputPath;
      }

      if ((typeof options.outputPath) == 'string' && options.outputPath.length > 0) {
        configOptions.outputPath = options.outputPath;
      }
 
      if ((typeof options.staticResourceFolder) == 'string' && options.staticResourceFolder.length > 0) {
        configOptions.staticResourceFolder = options.staticResourceFolder;
      }    

    } else {
      template = grunt.file.read(localAnt + '/antretrieve.build.xml');
    }

    if (utils.size(options.pkg) > 0) {
      configOptions.pkg = options.pkg;
    } else {
      throw 'pkg attribute is not defined';
    }

    configOptions.outputpages = path.join(configOptions.outputPath, conf.path.pagesFolder);
  };

  //executes contructor method
  init(options);

  return {
    //Unzip callback
    retrieveComplete: function() {
      grunt.log.writeln('Retrieve Complete');
    },

    execute: function() {

      grunt.log.writeln('This operation could take some seconds or minutes, depending on the size of the static resources to retrieve from the org');
        
      var done = this.retrieveComplete,
          target = configOptions.target,
          template;

      template = grunt.file.read(localAnt + '/antretrieve.build.xml');
      var staticResourceFolder = path.join(configOptions.staticResourceFolder, path.sep);
      var inputPath = path.join(configOptions.inputPath, staticResourceFolder);

      grunt.log.writeln('Retrieve Target -> ' + target);
      antUtils.parseAuth(options, target);
      configOptions.root = path.normalize(configOptions.root);
      configOptions.unpackaged = path.join(localTmp,'/package.xml');
      
      if(!configOptions.retrieveTarget) {configOptions.retrieveTarget = configOptions.root;}
      
      var buildFile = grunt.template.process(template, { data: configOptions });
      grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);
     
      if (!configOptions.existingPackage) {
        var packageXml = antUtils.buildPackageXml(configOptions.pkg, configOptions.apiVersion);
        grunt.file.write(path.join(configOptions.root,'/package.xml'), packageXml);
        console.log('package created -> ' +  grunt.file.exists(configOptions.root,'/package.xml'));       
      } else {
        if(grunt.file.exists(configOptions.root,'/package.xml')){
          grunt.file.copy(path.join(configOptions.root,'/package.xml'), path.join(localTmp,'/package.xml'));
        } else {
          grunt.log.error('No Package.xml file found in ' + configOptions.root);
          console.log('No Package.xml file found in ' + configOptions.root);
        }
      }

      antUtils.runAnt('retrieve', target, function(err, result) {
        var tmpStaticResources = path.join(configOptions.root, '/staticresources/');
        var tmpPages = path.join(configOptions.root, '/pages/');
        var outputPagesFolder = configOptions.outputpages;

        //Copy pages to outputPath
        if(grunt.file.exists(tmpPages)){
          grunt.file.recurse(tmpPages, function(abspath, rootdir, subdir, filename) { 
            grunt.file.copy(abspath, path.join(outputPagesFolder, filename));      
          });
        }

        //Unzip staticresources on input/staticresources
        if(grunt.file.exists(tmpStaticResources)){            

          var staticResources = fs.readdirSync(tmpStaticResources);

          if( staticResources !== null & staticResources.length > 0 ) {

            //Filter static Resources discarding the meta xmls
            staticResources = unzipper.filterStaticResources(staticResources);

            //Decompress all the static resources retrieved from the org
            unzipper.unzipStaticResources(tmpStaticResources, inputPath, staticResources, done);
          }else{
            console.log('There are not static resources retrieved from the org')
          }
        }
      });
    }
  };
};