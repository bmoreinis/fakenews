var http = require("http");
// Log console messages
var fs = require('fs');
var fpath = "/usr/lib/node_modules/server.log";
fs.appendFile(fpath, "Logging!\n");
var Sequelize = require('sequelize');

var server = http.createServer(function(req, resp) {
   var body = "";
   req.on('data', function (chunk) {
     body += chunk;
   });

   req.on('end', function () {
     fs.appendFile(fpath, body + "\n");
     var jsonObj = JSON.parse(body);

     console.log(jsonObj);

     saveUser(jsonObj)
	.then(function() { resp.end(JSON.stringify({success: true})); })
	.catch(function() { resp.end(JSON.stringify({success: false, error: err})); });
   })

});

server.listen(8080);

// Connect to DB with Sequelize
var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://[user]:[password]@localhost/fakenewsfitness-org');
sequelize
  .authenticate()
  .then(function(err) {
	fs.appendFile(fpath, "DB Connected!");
  })
  .catch(function (err) {
	fs.appendFile(fpath, "No DB Connection.");
  });

// Test Writing to DB
var Users = sequelize.define('users', {
  usersName: {
    type: Sequelize.STRING,
    field: 'users_name' // Will result in an attribute that is userName when user facing but users_name in the database
  },
  usersRoleID: {
    type: Sequelize.STRING,
    field: 'users_role_id'
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

function saveUser(data) {
  console.log("saveUser", data);
  return Users.create({
    usersName: data.username
  });
}

Users.sync({force: true}).then(function () {
  // Table recreated
  return Users.create({
    usersName: 'John',
    usersRoleID: '1'
  });
});

//Updating John to Fred
Users.find({where:{id:'1'}}).then(function (data) {
  if(data){
    data.updateAttributes({
    users_name:'Fred'
  }).success(function (data1) {
    console.log(data1);
  })
 }
})
.catch(function(err) { console.log(err); } );
