angular.module('TTL_ETL_UI', ['ttlController', 'ttlService', 'statsService', 'etlService', 'reportService']);


require('./controllers/main.js');
require('./services/etl.js');
require('./services/reports.js');
require('./services/stats.js');
require('./services/surveys.js');