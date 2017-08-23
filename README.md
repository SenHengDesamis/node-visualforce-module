# Deprecated & Defunct. DO NOT USE.

## Node Visualforce Module.

Node-Visualforce is a javascript library that allows a user to deploy a static web project into a Salesforce ORG as Visualforce pages including their static resources (css, img, fonts, js).
It converts .html files to visualforce .page format and generates the corresponding apex tags and xml files. For the static resources it compresses all files in the designated folder to an only one .resource file.
This Grunt plugin works using the migration tool API to connect to a Salesforce ORG, so it requires ANT tool installed.

### Package.json setup
We recommend that the package.json file includes the following dependencies:
```js
{
  "name": "project-name",
  "version": "x.x.x",
  "dependencies":{
    "node-visualforce-module":"0.1.0"
  }
}
```
### Build object.
This object has two methods, called build() and execute() which allows the user to setup configuration, convert files and pack them.

#### Build.build(options).
This method initialize the configuration of resources.

##### Build Config Options.
	- inputPath: defines the source folder structure (optional, by default => input/).
	- outputPath: defines the target folder structure (optional, by default => output/).
	- staticResourceFolder: defines internal source structure where you put css, js, img and font folders (optional, by default => staticresources/).

##### Build Config Example.
```js
var visual = require('node-visualforce-module');

var build = new visual.build({
	'inputPath':'input/',
	'outputPath':'output/',
	'staticResourceFolder':'staticresources/'
});
```
You have to put all your project files inside the following folder structure:
```shell
  - /input
    - /pages               #put all your .html files here
    - /staticresources     #static resources folder put your resources files here.
      - /<static resource name> # you can have more than one static resource, it will be indentified by the folder name
        - /css
        - /js
        - /img
        - /fonts
```
If you did not created the structure the module will create the base structure for you.

Internally you need to reference the static resources (css, js, img, fonts) using relative ('/') paths, for example:
- StyleSheets: "../staticresources/'static resources name'/css/sample.css"
- JavaScripts: "../staticresources/'static resources name'/js/vendors/jquery.js"
- Images: "../staticresources/'static resources name'/img/sample.png"
- Fonts:  "../fonts/Roboto/Roboto-Regular.ttf" (in sample.css)

if the user doesn't provide any options it takes the default values.

#### Build.execute(callback)
This method executes the conversion of files and pack tasks with the static content provided by the user.

##### Execute method callback function
This function indicates the ending of the build process.

##### Build execute Example.
```js
var visual = require('node-visualforce-module');

var build = new visual.build();
build.execute(function(args){
	console.log('its done!!!');
});
```

### Deploy Object.
This object has three methods, called deploy(), execute() and destroy() which allows the user to setup configuration, send the package and static files to the saleforce.com org, and undeploy pages or staticresources from the salesforce.com org.

#### Deploy.deploy(options).
This method allows the user to setup the configuration for the deployment process to salesforce.com. It receives a config object and sets the org credentials and type of content that the user wants to upload.

##### Deploy Config Options.
  - user: Salesforce Username (required).
  - pass: Salesforce Password (required).
  - token: Salesforce Token (required).
  - pkg: package to deploy. It is possible to deploy all the files from pages and staticresources using '*', or define which pages/staticresources deploy using a list separated by commas (required).
  - serverUrl: server url (optional, by default => https://login.salesforce.com).
  - apiVersion: Api Version (optional, by default => 29.0).
  - outputPath: defines the target folder structure (optional, by default => output/).

#### Deploy method usage example.
```js
var visual = require('node-visualforce-module');
var deploy = visual.deploy({
  user:'myusername@test.com',
  pass:      'mypassword',
  token:     'mytoken',
  apiVersion: '30.0',
  // Target-specific file lists and/or options go here.
  pkg: {   // Package to deploy
    staticresource: ['*'],
    pages: ['*']
  }
});
```
if the user doesn't provide any options it takes the default values.

#### Deploy.execute().
This method sends the specific content to saleforce.com.

### Deploy execute usage example.
```js
var visual = require('node-visualforce-module');
var deploy = visual.deploy(options);
deploy.execute();
```
#### Deploy.destroy().
In the case the user wants to undeploy all the site or some specific pages he can use the "destroy" method. It will remove the pages and staticresources specified in the options.

#### Deploy.destroy() method usage example.
```js
var visual = require('node-visualforce-module');
var deploy = visual.deploy(options);
deploy.destroy();
```

### Retrieve Object.
This object has two methods, called retrieve() and execute() which allows the user to setup configuration, retrieve the configured pages and staticresources from saleforce.com org.

#### Retrieve.retrieve(options).
This method allows the user to setup the configuration to be used in the retrieve process to salesforce.com. It receives a config object and sets the org credentials and type of content that the user wants to retrieve.

##### Retrieve Config Options.
  - user: Salesforce Username (required).
  - pass: Salesforce Password (required).
  - token: Salesforce Token (required).
  - pkg: package to deploy. It is possible to deploy all the files from pages and staticresources using '*', or define which pages/staticresources deploy using a list separated by commas (required).
  - serverUrl: server url (optional, by default => https://login.salesforce.com).
  - apiVersion: Api Version (optional, by default => 29.0).  
  - inputPath: defines the parent of the folder to save the uncompressed staticresources (optional, by default => input/).
  - outputPath: defines the target folder structure (optional, by default => output/).
  - staticResourceFolder: defines staticresources folder where the uncompressed static resources will be saved (optional, by default => staticresources/).

#### Deploy method usage example.
```js
var visual = require('node-visualforce-module');
var retrieve = visual.retrieve({
  user:'myusername@test.com',
  pass:      'mypassword',
  token:     'mytoken',
  apiVersion: '30.0',
  //Target-specific file lists and/or options go here.
  pkg: {   //Package to deploy
    staticresource: ['*'],
    pages: ['*']
  }
});
```
if the user doesn't provide any options it takes the default values.

#### Retrieve.execute().
This method retrieves the specific content from saleforce.com.

### Retrieve execute usage example.
```js
var visual = require('node-visualforce-module');
var retrieve = visual.retrieve(options);
deploy.execute();
```

### Proxy options
If you are under a proxy you will need to add the proxy host and port to the '<b>deploy</b>' and '<b>retrieve</b>' config options so the ant server can reach the org:
```js
  options:{
    ...
    proxyConfig: {
      proxyHost: "proxy.domain.com",
      proxyPort: "1111"
    }
  }
})
```
