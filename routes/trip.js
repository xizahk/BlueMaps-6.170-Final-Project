const express = require('express');

const router = express.Router();

const BlueMaps = require('../models/BlueMaps');
const session = require("express-session");


router.put("/", (req, res) => {
	if (req.body === undefined || req.body.stops === undefined) {
		res.status(400).json({error: "You must enter an address"})
	} else if (req.body.stops.length < 2) {
		res.status(400).json({error: "You must enter at least 2 addresses"})
	} else {
		let stops = req.body.stops;
		let originAddress = stops[0];
		let destinationAddress = stops[stops.length-1];
		stops = stops.slice(1, stops.length-1);
		BlueMaps.findMultiStopTrip(req.session.email, originAddress, destinationAddress, stops).then(function(trip) {
			res.status(200).json(trip).end();
		})
		.catch(err => {
			res.status(400).json({error: err}).end();
		})
	}
});

module.exports = router;
