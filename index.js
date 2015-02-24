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
app.set('ipaddr', settings.application.ip);
app.set('port', process.env.PORT || settings.application.port);
if (process.env.PORT) {
  settings.application.port = process.env.PORT;
}
app.set('views', 'views');
app.set('view engine', 'jade');
app.set('trust proxy', true);
app.enable("jsonp callback"); //TODO: Remove this if not needed because of CORS
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon_rc.jpg')));
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
  var startMessage = "TTL ETL Server listening";

  if (app.get('ipaddr')) {
    startMessage += ' on IP:' + app.get('ipaddr') + ', ';
  }

  startMessage += ' on port ' + app.get('port');
  console.log(startMessage);
});

