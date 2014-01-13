##Node visualforce library.

Node-Visualforce is a javascript library that allows a user to deploy a static web project into a Salesforce ORG as Visualforce pages including their static resources (css, img, fonts, js).
It converts .html files to visualforce .page format and generates the corresponding apex tags and xml files. For the static resources it compresses all files in the designated folder to an only one .resource file.
This Grunt plugin works using the migration tool API to connect to a Salesforce ORG, so it requires ANT tool installed.

###Package.json setup
We recommend that the package.json file includes the following dependencies:
```js
{
  "name": "project-name",
  "version": "x.x.x",
  "dependencies":{
    "visualforce":"0.1.0"
  }
}
```
###Build object.
This object has two methods, called build() and execute() which allows the user to setup configuration, convert files and pack them.

####Build.build(options).
This method initialize the configuration of resources.

#####Build Config Options.
	- inputPath: defines the source folder structure.
	- outputPath: defines the target forlder structure.
	- staticResourceFolder: defines internal source structure where you put css, js, img and font folders.
	- staticResourceName: defines the name of the package.

#####Build Config Example.
```js
var visual = require('visualforce');

var build = new visual.build({
	'inputPath':'/input',
	'ouputPath':'/output',
	'staticResourceFolder':'/staticresources',
	'staticResourceName':'staticresources'
});
```
if the user doesn't provide any options it takes the default values that are shown in the previous example.

####Build.execute(callback)
This method executes the conversion of files and pack tasks with the static content provided by the user.

#####Execute method callback function
This function indicates the ending of the build process.

#####Build execute Example.
```js
var visual = require('visualforce');

var build = new visual.build();
build.execute(function(args){
	console.log('its done!!!');
});
```

###Deploy Object.
This object has two methods, called deploy() and execute() which allows the user to setup configuration, send the package and static files to the saleforce.con org.

####Deploy.deploy(options).
This method allows the user to setup the configuration for the deployment process to salesforce.com. It receives a config object
and sets the org credentials and type of content that the user wants to upload.

####Deploy method usage example.
```js
var visual = require('visualforce');
var deploy = visual.deploy({
        user:'myusername@test.com',
        pass:      'mypassword',
        token:     'mytoken',
        serverurl: 'https://test.salesforce.com', // default => https://login.salesforce.com
        apiVersion: '29.0'
      },
      // Target-specific file lists and/or options go here.
      pkg: {   // Package to deploy
        staticresource: ['*'],
        pages: ['*']
      }
});
```
if the user doesn't provide any options it takes the default values that are shown in the previous example.

####Deploy.execute().
This method sends the specific content to saleforce.com.

###Deploy execute usage example.
```js
var visual = require('visualforce');
var deploy = visual.deploy(options);
deploy.execute();
```
####Deploy.destroy().
In the case the user wants to undeploy all the site or some specific pages he can use the "destroy" method. It will remove the pages and staticresources specified in the options.

####Deploy.destroy() method usage example.
```js
var visual = require('visualforce');
var deploy = visual.deploy(options);
deploy.destroy();
```