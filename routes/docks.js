const express = require('express');

const router = express.Router();

const BlueMaps = require('../models/BlueMaps');
const session = require("express-session");

/**
 * Returns the all the docks info
 * @name GET/api/docks
 * @returns {docks} - list of dock objects
 * @throws {400} - if an error occurred gettings these docks
 */
router.get("/", (req, res) => {
	console.log('In get call');
	BlueMaps.getDockStatus().then(function(docks) {
		console.log(docks);
		res.status(200).json(docks).end();
	})
	.catch(err => {
		res.status(400).json({error: err}).end();
	})
});

module.exports = router;
