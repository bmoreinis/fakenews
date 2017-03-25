var http = require("http");
var configdb = require('./mydb').configdb;

// Log console messages
var fs = require('fs');
var fpath = "/usr/lib/node_modules/fakenews/tserver.log";
fs.appendFile(fpath, "Logging! -1\n"+configdb);
// pm2 start tserver.js --merge-logs

// Initiate Server
var server = http.createServer(function(req, resp) {
  var body = "";
  req.on('data', function (chunk) {
    body += chunk;
  });
  req.on('end', function () {
    fs.appendFile(fpath, body + "\n");
    var jsonObj = JSON.parse(body);
    console.log(jsonObj);
    saveUser(jsonObj);
    savePage(jsonObj)
    .then(function() { resp.end(JSON.stringify({success: true})); })
    .catch(function() { resp.end(JSON.stringify({success: false, error: err})); });
  })
});

server.listen(8082);

// Connect to DB with Sequelize
var Sequelize = require('sequelize');
var sequelize = new Sequelize(configdb);
sequelize
  .authenticate()
  .then(function(err) {
	fs.appendFile(fpath, "DB Connected!");
  })
  .catch(function (err) {
	fs.appendFile(fpath, "No DB Connection.");
  });

// Write to DB
var Users = sequelize.define('users', {
  usersName: {
    type: Sequelize.STRING,
    field: 'name' // Will result in an attribute that is userName when user facing but users_name in the database
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});


var Pages = sequelize.define('pages', {
  pageURL: {
    type: Sequelize.STRING,
    field: 'url' // Will result in an attribute that is pageURL when user facing but url in the database
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});


function saveUser(data) {
  console.log("saveUser", data);
  return Users.create({
    usersName: data.name
  });
}


function savePage(data) {
  console.log("savePage", data);
  return Pages.create({
    pageURL: data.url
   });
}
