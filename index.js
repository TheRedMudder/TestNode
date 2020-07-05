//Required Imports
const express = require("express"); // Express Server
const logger = require("./logger"); // For Debugging
const app = express(); //Init Express
const mongoose = require('mongoose'); //DB Schema Client

//Enable CORS for testing purposes
app.use(function (req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");next();});

//DataBase
mongoose.connect('mongodb://localhost:27017/TimeDB2',  { useNewUrlParser: true, useUnifiedTopology: true });

//Server
var bodyParser = require("body-parser");//For JSON Body
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000; //PORT
app.use(logger); //Init Middlewear For Debugging

//Main Code Init
app.use("/", require("./routes/AllRoutes"));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));