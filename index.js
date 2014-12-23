/**

 TTL_ETL Runner.
 Connects to FormHub API, finds a list of all surveys.
 Finds the most recent survey versions (if a single survey has multiple versions), and downloads them.
 Next, inserts data into PostGres.

 **/

var path = require("path"),
  flow = require("flow")
  express = require('express'),
  http = require('http'),
  cors = require('cors'),
  app = express(),
  settings = require("./settings/settings.js"),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  favicon = require('serve-favicon'),
  multer = require('multer'),
  errorHandler = require('errorhandler');

// all environments
app.set('ipaddr', "localhost");
app.set('port', process.env.PORT || settings.application.port);
if (process.env.PORT) {
  settings.application.port = process.env.PORT;
}
app.set('views', 'views');
app.set('view engine', 'jade');
app.set('trust proxy', true);
app.enable("jsonp callback"); //TODO: Remove this if not needed because of CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));


//This must be after app.use(passport.initialize())
app.use(cors());

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}


//Load Routes
var routes = require('./routes');

app.use('/', routes);

//Create web server
http.createServer(app).listen(app.get('port'), app.get('ipaddr'), function () {
  var startMessage = "GuardDuty Server listening";

  if (app.get('ipaddr')) {
    startMessage += ' on IP:' + app.get('ipaddr') + ', ';
  }

  startMessage += ' on port ' + app.get('port');
  console.log(startMessage);
});


//var self = this;
//
////Dynamically load .js files from the root folder.
//require("fs").readdirSync(__dirname).forEach(function (file) {
//
//  if (path.extname(file) === ".js" && file != "index.js") {
//    try {
//      var operation = require(__dirname + "/" + file);
//      var page = new operation();
//      if (page && page.run) page.run(self.MULTI());
//    }
//    catch (e) {
//      console.log("Error loading page " + e)
//    }
//  }
//})
