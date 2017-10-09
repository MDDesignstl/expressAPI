var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
var tables = ["product","user","purchase"]

var bcrypt = require('bcrypt');
const saltRounds = 10;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//POST call  to validate password
app.post('/login', function (req, res) {
  jsonBody = req.body;
  username = req.body.username;
  password = req.body.password;
  userId = 0;
  hashedPassword = "";
  connection = getConnection()
  query = "Select id, password FROM user WHERE username ='" + username +"'";

  //Get user hashed password associated with username
  connection.query(query, function (err, result, fields) {
    //TODO: handle what happens when the username is not found
    result = result[0];
    userId = result.id;
    hashedPassword = result.password;

    console.log(userId);
    console.log(hashedPassword);

      //compare hash
  validLogin = bcrypt.compareSync(password, hashedPassword);
  console.log(validLogin);
  res.send({validLogin,userId});
  connection.end();
  });

});

//GET call  to grab all items from table
app.get('/:table', function (req, res) {
  table = req.params.table
  //check if table is valid
  if (!tables.includes(table)) {
    res.send("Invalid Request: Table not found");
  } else {
      //set fields to select
      if (req.query.fields) {
        fields = req.query.fields;
      } else {
        fields ="*";
      }
    //build query
    query = "SELECT " + fields + " FROM " + table
    //establish connection
    connection = getConnection()
    //query the db
    connection.query(query ,function (err, result, fields) {
      if (err) throw err;
      dbData = result
      console.log(dbData)
      //send response
      res.send(dbData)
      connection.end()
    })
  }

});
 
//PUT call to add item to db from form
app.put('/:table', function (req, res) {
  table = req.params.table
  //check if table is valid
  if (!tables.includes(table)) {
    res.send("Invalid Request: Table not found");
  } else {
    //grab request body and store fields and values
    jsonBody = req.body
    fields =Object.keys(jsonBody)
    values =Object.values(jsonBody)
    newValList =""
    //write values to list for query
    for (i in values) {
      //hash password field if present
      if (fields[i] == 'password'){
        values[i] = hashPassword(values[i]);
      }
      //determine if value needs quotes
      if (values[i] instanceof Number) {
        newValList += values[i];
      } else {
        newValList += "'" + values[i] + "'";
      }
        //seperate values by comma, except for last value
        if (i != Object.keys(jsonBody).length- 1) {
          newValList += ",";
        }
    }
      
    //build query
    query ="INSERT INTO " + table + " (" + fields + ") VALUES (" + newValList +")"
    console.log(query)
    //establish connection
    connection = getConnection()
    //query the db
    connection.query(query, values,function (err, result, fields) {
    if (err) throw err;
    dbData = result
    console.log(dbData)
    res.send(dbData)
    })
    connection.end()
  }
});

//GET call for specific record
app.get('/:table/:id', function (req, res) {
  table = req.params.table
  //check if table id valid
  if (!tables.includes(table)) {
      res.send("Invalid Request: Table not found");
  } else {
      
    //set fields to select
    if (req.query.fields) {
      fields = req.query.fields;
    } else {
      fields ="*";
    }
    //grab id from url
    id = req.params.id
    //build query
    query = "SELECT " + fields + " FROM " + table + " WHERE id = " + id
    //establish connection
    connection = getConnection()
    //query the db
    connection.query(query,function (err, result, fields) {
      if (err) throw err;
      dbData = result
      console.log(dbData)
      res.send(dbData)
    })
    connection.end()
  }
});

//Post call to update record

app.post('/:table/:id', function (req, res) {
  table = req.params.table
  //check if table is valid
  if (!tables.includes(table)) {
    res.send("Invalid Request: Table not found");
  } else {
    //grab request body and store fields and values
    jsonBody = req.body
    fields =Object.keys(jsonBody)
    values =Object.values(jsonBody)
    newValList =""
    //write fields and new values to list for query
    for (i in values) {
      //hash password field if present
      if (fields[i] == 'password'){
        console.log(values[i]);
        values[i] = hashPassword(values[i]);
        console.log(values[i]);
      }
      //determine if value needs quotes
      if (values[i] instanceof Number) {
        newValList += fields[i] + "=" + values[i];
      } else {
        newValList += fields[i] + "='" + values[i] + "'";
      }
        //seperate values by comma, except for last value
        if (i != Object.keys(jsonBody).length- 1) {
          newValList += ",";
        }
    }
      console.log(newValList)
    //grab id from url
    id = req.params.id
    //build query
    query ="UPDATE " + table + " SET " + newValList + " WHERE id = " + id
    console.log(query)
    //establish connection
    connection = getConnection()
    //query the db
    connection.query(query, values,function (err, result, fields) {
    if (err) throw err;
    dbData = result
    console.log(dbData)
    res.send(dbData)
    })
    connection.end()
  }
});

//Connection function
function getConnection() {
  var mysql      = require('mysql');
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'tshirtdb'
  });
  connection.connect();
  return connection;
}
//hash password
function hashPassword(password) {
var salt = bcrypt.genSaltSync(saltRounds);
var hash = bcrypt.hashSync(password, salt);
return hash;
}
//check password

// test server

var httpServer = http.createServer(app);

httpServer.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
