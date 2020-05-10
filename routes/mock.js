const express = require('express');

const router = express.Router();

router.put('/account/signin', (req, res) => {
    res.status(200).json({
        userEmail: "signIn@lol.com"
    })
});

router.put('/account/signout', (req, res) => {
    res.status(200)
});

router.post('/account/', (req, res) => {
   res.status(200).json({
       userEmail: "createUser@mit.edu"
   })
});

/**
 * Returns a mocked trip with mocked route information
 */
router.get('/trip', (req, res) => {
    let WALKING = "WALKING";
    let BICYCLING = "BICYCLING";

    let route1 = {
        stop1: 1,
        stop2: 2,
        type: WALKING,
        time: 180,
        directions: ["turn left and walk", "keep walking", "don't stop"],
    };

    let route2 = {
        stop1: 2,
        stop2: 3,
        type: BICYCLING,
        time: 600,
        directions: ["bike and bike", "laugh and laugh"],
    };

    let route3 = {
        stop1: 3,
        stop2: 4,
        type: WALKING,
        time: 120,
        directions: ["you're almost there", "just keep walking!"],
    };

    let stop1 = {
        id: 1,
        lat: 42.3573128,
        lon: -71.1030593,
        is_dock: false,
        name: "Stop1"
    };

    let stop2 = {
        id: 2,
        lat: 42.3564055,
        lon: -71.104246,
        is_dock: true,
        name: "Stop2"
    };

    let stop3 = {
        id: 3,
        lat: 42.3628504,
        lon: -71.0871144,
        is_dock: true,
        name: "Stop3"
    };

    let stop4 = {
        id: 4,
        lat: 42.3600483,
        lon: -71.0957192,
        is_dock: false,
        name: "Stop4"
    };

    let stops = [stop1, stop2, stop3, stop4];

    // Note: time is in seconds
    res.status(200).json({
        routes: [
            route1,
            route2,
            route3
        ],
        stops,
        saved: {isSaved: false, id: ""},

    });
});


module.exports = router;