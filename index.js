const express = require('express');
const ejs = require('ejs');
const cookieParser = require("cookie-parser");
require('dotenv').config();
const bodyParser = require('body-parser');

const mainRouter = require('./routes/main.js')

const app = new express();

app.use(express.static(__dirname+"/public"));
app.set('view engine','ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use('',mainRouter);

app.listen(process.env.port,()=>{
    console.log("Server up and running on "+process.env.port);
})
