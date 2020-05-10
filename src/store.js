import Vue from "vue";
import axios from "axios";
import EventBus from './event-bus'

// to access the store, import { store, mutations, actions } from store.js

export const contentTitles = {
    HOME: "Home",
    CREATE_USER: "Create User",
    SIGN_IN: "Sign In",
    SAVED_TRIPS: "My Trips"
};

export var store = Vue.observable({
    // Account state variables
    isSignedIn: false,
    userEmail: "",
    savedTrips: [], // array of saved trips

    // Current Trip state variables
    hasOngoingTrip: false, // true if there is a current ongoing trip
    isTripSaved: false, // whether or not current trip is saved
    inputAddresses: ["", ""], // list of addresses inputted by the user in the address form
    startLocation: "",
    endLocation: "",
    tripTimeString: "", // string of estimated total travel time
    routes: [], // each route has {stop1: number, stop2: number, type: String, time: number} where stop1 and stop2 correspond to keys in stops
    docks: [], // each dock has {stationID: string, latitude: number, longitude: number, name: string, numBikes: int, numSpaces: int}
    stops: new Map(), // maps id to stops where each stop has {lat: number, lon: number, is_dock: boolean}
    currentTripId: "",

    // Web-page display variables
    errors: [], // list of error messages
    successes: [], // list of success messages (e.g. "email sent successfully!")
    showOverlay: false, // determines whether we should show overlay for map ui
    isBikeMode: true, // determines whether dock markers are shown in terms of bikes available or dock slots available
    currentContent: contentTitles.HOME,
});

export var mutations = {
    // contains functions that mutate (updates) the state
    signIn: function(res) {
      store.userEmail = res.data.userEmail;
      store.isSignedIn = true;
      store.currentContent = contentTitles.HOME;
      store.savedTrips = [];
    },
    signOut: function() {
        store.userEmail = "";
        store.isSignedIn = false;
        store.currentContent = contentTitles.HOME; // Return user to home page
        store.savedTrips = [];
    },
    updateRoutes: function(routes) {
        store.routes = routes;
    },
    updateStops: function(stops) {
        store.stops = stops;
    },
    updateInputAddresses: function(addresses) {
        store.inputAddresses = addresses;
    },
    updateSavedTrips: function(savedTrips) {
        store.savedTrips = savedTrips;
    },
    updateShowOverlay: function(showOverlay) {
        store.showOverlay = showOverlay;
    },
    updateTripTimeString: function(timeString) {
        store.tripTimeString = timeString;
    },
    updateIsTripSaved: function(isTripSaved) {
        store.isTripSaved = isTripSaved;
    },
    updateTripStatus: function(hasOngoingTrip) {
        store.hasOngoingTrip = hasOngoingTrip;
    },
    updateDockStatus: function(docks) {
        store.docks = docks;
    },
    updateIsBikeMode: function(isBikeMode) {
        store.isBikeMode = isBikeMode;
    },
    updateCurrentTripId: function(id) {
        store.currentTripId = id;
    },
    setContentView: function(contentTitle) {
        store.currentContent = contentTitle;
    },
    addErrorMessage: function(err) {
        // Adds a given error message to the errors list
        if (err.response && err.response.data && err.response.data.error) {
            store.errors.push(err.response.data.error);
        } else {
            store.errors.push(err);
        }
    },
    deleteErrorMessage: function() {
        // Deletes the oldest error message from the errors list in 5000ms (delayed deletion)
        setTimeout(() => {
            store.errors.shift();
        }, 5000);
    },
    addSuccessMessage: function(msg) {
        store.successes.push(msg);
    },
    deleteSuccessMessage: function() {
        setTimeout(() =>{
            store.successes.shift();
        }, 5000);
    }
};


export var actions = {
    // Contains functions that perform computations and call mutation functions
    signInAction: function(email, password) {
        const bodyContent = {email, password};
        axios
            .put("/api/account/signin", bodyContent)
            .then((res) => {
                mutations.signIn(res);
            })
            .catch(err => {
                // handle error
                actions.addAndDeleteErrorMessage(err);
            });
    },
    signOutAction: function() {
        axios
            .put("/api/account/signout", {})
            .then(() => {
                // handle success
                mutations.signOut()
            })
            .catch(err => {
                // handle error
                actions.addAndDeleteErrorMessage(err);
            })
    },
    createUserAction: function(email, password) {
        let bodyContent = {email, password};
        axios
            .post("/api/account/", bodyContent)
            .then((res) => {
                mutations.signIn(res);
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            });
    },
    getSavedTrips: function() {
        axios
            .get('/api/account/trips', {})
            .then((res) => {
                mutations.updateSavedTrips(res.data);
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            });
    },
    toggleBikeModeAction: function() {
        mutations.updateIsBikeMode(!store.isBikeMode);
    },
    switchViewAction: function(contentTitle) {
        try {
            // If we are navigating away from the map and there is an ongoing trip, end that trip
            if (store.currentContent === contentTitles.HOME && store.currentContent !== contentTitle
                && store.hasOngoingTrip) {
                actions.endTrip();
            }
            // If we are navigating to saved trips, retrieve the user's trips from the server
            if (contentTitle === contentTitles.SAVED_TRIPS) {
                actions.getSavedTrips();
            }
            mutations.setContentView(contentTitle);
        } catch(err) {
            actions.addAndDeleteErrorMessage(err);
        }
    },
    endTrip: function() {
        mutations.updateTripTimeString("");
        mutations.updateIsTripSaved(false);
        mutations.updateRoutes([]);
        mutations.updateStops(new Map());
        mutations.updateInputAddresses(["", ""]);
        mutations.updateTripStatus(false);
        mutations.updateCurrentTripId("");
    },
    getTripAction: function(stops) {
        actions.getDocks();
        let bodyContent = {stops}
        // switch to map view first and overlay loading screen
        actions.switchViewAction(contentTitles.HOME);
        mutations.updateShowOverlay(true);
        axios
            .put("/api/trip", bodyContent)
            .then(res => {
                if (res.data) {
                    mutations.updateRoutes(res.data.routes);
                    mutations.updateTripStatus(true);

                    // Create Map object that maps stop_id : stop
                    // Update stops with new stops map
                    let stopsMap = new Map();
                    let stops = res.data.stops;
                    stops.forEach(stop => {
                        stopsMap.set(stop.id, stop);
                    });
                    mutations.updateStops(stopsMap);
                    // updates the address form to reflect the full names of addresses
                    mutations.updateInputAddresses(stops.filter(stop => !stop.is_dock).map(stop => stop.name));
                    // compute the total travel time of the trip
                    let secondsTotal = store.routes.map(route => route.time).reduce((a, b) => a + b, 0);
                    let timeString = utils.convertSecondsToTimeString(secondsTotal);
                    mutations.updateTripTimeString(timeString);

                    // Update current trip id if the current trip is already saved
                    if (res.data.saved.isSaved) {
                        mutations.updateIsTripSaved(true);
                        mutations.updateCurrentTripId(res.data.saved.id);
                    } else {
                        mutations.updateIsTripSaved(false);
                        mutations.updateCurrentTripId("");
                    }
                    EventBus.$emit('renderRoutes');
                }
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            })
            .finally(() => {
                mutations.updateShowOverlay(false);
            });
    },
    saveTripAction: function() {
        let stops = [...store.stops.values()].filter(stop => !stop.is_dock).map(stop => {
            return {
                lon: stop.lon,
                lat: stop.lat,
                name: stop.name
            }
        });
        let bodyContent = {
            stops,
            time: store.tripTimeString,
        };
        axios
            .post("/api/account/trip", bodyContent)
            .then(res => {
                // save current trip id and update trip saved status
                mutations.updateCurrentTripId(res.data.id);
                mutations.updateIsTripSaved(true);
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            });
    },
    unsaveTripAction: function() {
        axios
            .delete("/api/account/trip/" + store.currentTripId)
            .then(() => {
                mutations.updateIsTripSaved(false);
                mutations.updateCurrentTripId("");
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            })
    },
    deleteSavedTrip: function(id) {
        axios
            .delete("/api/account/trip/" + id)
            .then(res => {
                actions.getSavedTrips();
            })
            .catch(err => {
               actions.addAndDeleteErrorMessage(err);
            });
    },
    getDocks: function() {
        axios
            .get("/api/docks")
            .then(res => {
                mutations.updateDockStatus(res.data);
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            });
    },
    sendEmail: function() {
        let bodyContent = {
            trip: store.routes.map(route => {
                return {
                    start: store.stops.get(route.stop1).name,
                    end: store.stops.get(route.stop2).name,
                    directions: route.directions
                }
            })
        };
        axios
            .put("/api/account/send", bodyContent)
            .then(() => {
                actions.addAndDeleteSuccessMessage("Email sent successfully!")
            })
            .catch(err => {
                actions.addAndDeleteErrorMessage(err);
            })
    },
    addAndDeleteSuccessMessage: function(msg) {
        mutations.addSuccessMessage(msg);
        mutations.deleteSuccessMessage(msg);
    },
    addAndDeleteErrorMessage: function(err) {
        // Adds an error message to the errors list and deletes the message after a delay
        mutations.addErrorMessage(err);
        mutations.deleteErrorMessage();
    },
};

export var utils = {
    convertSecondsToTimeString: function(secondsTotal) {
        // Compute how long the total trip time is and store the string
        let minutes = Math.floor(secondsTotal / 60);
        let seconds = secondsTotal % 60;
        // returns mm:ss indicating how long the travel will take
        return  minutes + ":" + ('0'+seconds).slice(-2);
    },
    shortenString: function(s, numCharacters) {
        let sliced = (s.length > numCharacters) ? s.slice(0, numCharacters) + "..." : s;
        return sliced;
    }
}

