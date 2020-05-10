const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");

// app.require all the routes go here
const mockRouter = require('./routes/mock');
const tripRouter = require('./routes/trip');
const accountRouter = require('./routes/account');
const dockRouter = require('./routes/docks');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/dist'))); // Note
//app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: "6170", resave: true, saveUninitialized: true }));

// app.use for the routers here
app.use('/api/mock', mockRouter);
app.use('/api/trip', tripRouter);
app.use('/api/account', accountRouter);
app.use('/api/docks', dockRouter);
app.use(function (req, res, next) {
  res.status(404).send("Sorry, can't find that page! Please go back to the previous page to use BlueMaps.")
});
module.exports = app;
