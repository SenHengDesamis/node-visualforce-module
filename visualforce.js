'use strict';
var grunt = require('grunt');
var path = require('path');
var utils = require('./lib/utils');
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

    } else {
      //sets default options to config object
      configOptions.inputPath = conf.path.inputPath;
      configOptions.outputPath = conf.path.outputPath;
      configOptions.staticResourceFolder = conf.path.staticResourceFolder;
      configOptions.staticResourceName = conf.fileNames.staticResourceName;
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
   * function that seeks for the metadata
   * @param  {string} key key definition
   * @return {void}
   */
  var lookupMetadata = function(key) {
    key = key.toLowerCase();
    var typeName;
    // try to match on metadata type
    if (metadata[key] && metadata[key].xmlType) {
      typeName = metadata[key].xmlType;
    } else {
      // try to match on folder
      Object.keys(metadata).forEach(function(mk) {
        var folder = metadata[mk].folder;
        if (typeof folder === 'string' && folder.toLowerCase() === key) {
          typeName = metadata[mk].xmlType;
        } else if (key === 'documents') {
          typeName = metadata.document.xmlType;
        } else if (key === 'emails') {
          typeName = metadata.email.xmlType;
        } else if (key === 'reports') {
          typeName = metadata.report.xmlType;
        } else if (key === 'dashboards') {
          typeName = metadata.dashboard.xmlType;
        }
      });
    }
    return typeName;
  };

  /**
   * function that clears the deployment folder structure.
   * @return {void}
   */
  var clearLocalTmp = function() {
    if (grunt.file.exists(localTmp)) {
      grunt.file.delete(localTmp, {
        force: true
      });
    }
  };

  /**
   * function that creates the directories for deployment
   * @return {void}
   */
  var makeLocalTmp = function() {
    clearLocalTmp();
    grunt.file.mkdir(localTmp);
    grunt.file.mkdir(localTmp + '/ant');
  };

  /**
   * function that pase if the auth params comes from command line and set them
   * on options object
   * @param  {object} options configuration object
   * @param  {string} target  deployment org
   * @return {void}
   */
  var parseAuth = function(options, target) {
    var un = options.user;
    var pw = options.pass;
    var tk = options.token;

    if (tk) {
      pw += tk;
    }
    if (!un) {
      grunt.log.error('no username specified for ' + target);
    }
    if (!pw) {
      grunt.log.error('no password specified for ' + target);
    }
    if (!un || !pw) {
      grunt.fail.warn('username/password error');
    }

    options.user = un;
    options.pass = pw;

    grunt.log.writeln('User -> ' + options.user.green);
  };

  /**
   * function that runs ant task
   * @param  {string}   task   ant task label
   * @param  {string}   target notification text
   * @param  {Function} done   async function
   * @return {void}
   */
  var runAnt = function(task, target, done) {
    var args = [
      '-buildfile',
      localTmp + '/ant/build.xml',
      '-lib',
      localLib,
      '-Dbasedir=' + process.cwd()
    ];
    args.push(task);
    grunt.log.debug('ANT CMD: ant ' + args.join(' '));
    grunt.log.writeln('Starting ANT ' + task + '...');
    var ant = grunt.util.spawn({
      cmd: 'ant',
      args: args
    }, function(error, result, code) {
      if (error) {
        grunt.fail.warn(error, code);
      } else {
        grunt.log.ok(task + ' target ' + target + ' successful');
      }
      done(error, result);
    });
    ant.stdout.on('data', function(data) {
      grunt.log.write(data);
    });
    ant.stderr.on('data', function(data) {
      grunt.log.error(data);
    });
  };

  /**
   * function that build the package xml to deploy resources
   * @param  {object} pkg     meta-data objecte
   * @param  {string} version saleforce api version
   * @return {array}          array whith xml
   */
  var buildPackageXml = function(pkg, version) {
    var packageXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'
    ];
    if (pkg) {
      Object.keys(pkg).forEach(function(key) {
        var type = pkg[key];
        var typeName = lookupMetadata(key);
        if (!typeName) {
          grunt.fail.fatal(key + ' is not a valid metadata type');
        }
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
  };

  /**
   * constructor method
   * @param  {object} options conguration object
   * @return {void}
   */
  var init = function(options) {
    makeLocalTmp();

    configOptions = {
      target: 'default',
      user: false,
      pass: false,
      token: false,
      root: conf.path.outputPath,
      apiVersion: conf.page.options.apiVersion,
      serverurl: 'https://login.salesforce.com',
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
      parseAuth(this.getConfig(), this.getConfig().target);

      this.getConfig().tests = [];
      var buildFile = grunt.template.process(template, {
        data: this.getConfig()
      });

      grunt.file.write(localTmp + '/ant/build.xml', buildFile);

      var packageXml = buildPackageXml(this.getConfig().pkg, this.getConfig().apiVersion);
      grunt.file.write(this.getConfig().root + '/package.xml', packageXml);

      runAnt('deploy', this.getConfig().target, function(err, result) {
        clearLocalTmp();
      });
    },
    /**
     * method to undeploy project from salesforce.com
     * @return {void}
     */
    destroy: function() {
      makeLocalTmp();

      var template = grunt.file.read(localAnt + '/antdeploy.build.xml');

      grunt.log.writeln('Destroy Target -> ' + this.getConfig().target);
      parseAuth(this.getConfig(), this.getConfig().target);

      this.getConfig().tests = [];
      var buildFile = grunt.template.process(template, {
        data: this.getConfig()
      });
      grunt.file.write(localTmp + '/ant/build.xml', buildFile);

      var packageXml = buildPackageXml(null, this.getConfig().apiVersion);
      grunt.file.write(his.getConfig().root + '/package.xml', packageXml);

      var destructiveXml = buildPackageXml(this.getConfig().pkg, this.getConfig().apiVersion);
      grunt.file.write(his.getConfig().root + '/destructiveChanges.xml', destructiveXml);

      runAnt('deploy', target, function(err, result) {
        clearLocalTmp();
      });
    }
  };
};