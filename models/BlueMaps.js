const uuidv1 = require('uuid/v1');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');
const apikey = 'Insert-key-here'
var loaded = false;

const Account = require('./Account');

let docks = [];
let dockDurations = [];

//these values filled in as algorithm goes
//all should be filled in by end

let concurrentMap = {};


/**
  * @typedef Dock 
  * @prop {int} latitude - the latitude of the dock
  * @prop {int} longitude - the longitude of the dock
  * @prop {string} name - the descriptive name of the dock
  * @prop {string} shortName - the short name of the dock
  * @prop {string} stationID - the ID of the dock
  * @prop {int} capacity - the capacity of this dock
  * @prop {int} numBikes - the number of current bikes available at this dock 
  * @prop {int} numSpaces - the number of empty spaces at this dock
  */

/**
  * @typedef BikingDuration
  * @prop {string} startStationID - the station ID of the start dock
  * @prop {string} endStationID - the station ID of the end dock
  * @prop {int} tripDuration - the duration between these two docks
*/

/**
  * @typdedef WalkingDuration
  * @prop {string} stationID - the station ID to walk to or from
  * @prop {int} tripDuration - the duration to walk to or from this dock
*/



class BlueMaps {

	/**
	* Boots up the system, loading all BlueBike data needed before starting
	* Should be called before the system is first used!
	*/
	static bootUp() {
		if (!loaded) {
			var augustDockDuration = '08-2019-bluebike-data.csv';
			var mayDockDuration = '05-2019-bluebike-data.csv';
			var novemberDockDuration = '11-2019-bluebike-data.csv';
			var promise = new Promise(
				function(resolve, reject) {
					BlueMaps.loadAllDocks().then(function() {
						BlueMaps.loadDockDuration(augustDockDuration).then(function() {
							BlueMaps.loadDockDuration(novemberDockDuration).then(function() {
								BlueMaps.loadDockDuration(mayDockDuration).then(function() {
									loaded = true;
									resolve();
								})
							})
						})
					})
				})
			return promise;
		}
		else {
			var promise = new Promise(
				function(resolve, reject) {
					resolve();
				})
			return promise;
		}
	}

	/**
	* Gets all the docks from BlueBikes API
	*/
	static loadAllDocks() {
		var promise = new Promise(
			function(resolve, reject) {
				axios.get('https://gbfs.bluebikes.com/gbfs/en/station_information.json')
					.then(res => {
						var stations = res.data.data.stations
						stations.forEach((station, index) => {
							var latitude = station.lat;
							var longitude = station.lon;
							var name = station.name; 
							var shortName = station.short_name;
							var stationID = station.station_id;
							var capacity = station.capacity;
							var numBikes = undefined;
							var numSpaces = undefined;
							var dock = {latitude, longitude, name, shortName, stationID, capacity, numBikes, numSpaces};
							docks.push(dock);
						})
						console.log(docks);
						resolve();
					})
					.catch(err => {
						//do nothing, since the user has not signed in
						console.log('error!');
						reject();
					});
			})
		return promise;
	}
	/**
	* Returns all of the docks
	* @return {Dock[]} - the array of all docks
	*/
	static getAllDocks() {
		return docks;
	}
	/**
	* Loads the status of each dock
	*/
	static loadDockStatus() {
		var promise = new Promise(
			function(resolve, reject) {
				axios.get('https://gbfs.bluebikes.com/gbfs/en/station_status.json')
					.then(res => {
						var stations = res.data.data.stations
						stations.forEach((station, index) => {
							var stationID = station.station_id;
							var numBikes = station.num_bikes_available;
							var dock = docks.filter(dock => dock.stationID === stationID)[0];
							dock.numBikes = numBikes
							var numSpaces = dock.capacity - numBikes;
							dock.numSpaces = numSpaces
						})
						console.log(docks);
						resolve();
					})
					.catch(err => {
						console.log('error!');
						console.log(err);
						reject();
					});
			})
		return promise;
	}
	/**
	* Gets the dock information
	*/
	static getDockStatus() {
		console.log('In dock status call');
		var promise = new Promise(
			function(resolve, reject) {
				BlueMaps.loadDockStatus().then(function() {
					console.log(docks);
					resolve(docks);
				}, function() {
					reject('Could not get dock information');
				});
			});
		return promise;
	}
	/**
	* Loads the dock duration in between docks given by user data in CSV file fileName
	* @param {string} filename - the name of the CSV file to read for user data
	*/
	static loadDockDuration(fileName) {
		var promise = new Promise(
			function(resolve, reject) {
				  fs.createReadStream(fileName)
				  .pipe(csv())
				  .on('data', (row) => {
				  	var startStationID = row['start station id'];
				  	var endStationID = row['end station id'];
				  	var tripDuration = row['tripduration'];
				  	var duration = {startStationID, endStationID, tripDuration};
				  	dockDurations.push(duration);
				  })
				  .on('end', () => {
				  	console.log(dockDurations);
				    console.log('CSV file successfully processed');
				    resolve();
				  });
			})
		return promise;
	}
	/**
	* Gets the minimum trip duration between dock of station ID startID and endID
	* @param {string} startID - the station ID of the beginning dock
	* @param {string} endID - the station ID of the destination dock
	* @return {int} - the minimum duration it takes between these two docks
	*/
	static getDockDuration(startID, endID) {
		var filteredDockDurations = dockDurations.filter(duration => (duration.startStationID === startID && duration.endStationID === endID) ||
											(duration.startStationID === endID && duration.endStationID === startID));
		if (filteredDockDurations.length === 0) {
			return Infinity;
		}
		else {
			//return the average
			return Math.ceil(
				filteredDockDurations.map(duration => parseInt(duration.tripDuration)).reduce((a,b) => a+b,0) / filteredDockDurations.length);
		}
	}

	/**
	* Finds the docks within the given radius of the lat, lon coords
	* @param {int} lat - the latitude of the location
	* @param {int} lon - the longitude of the location
	* @param {int} radius - the radius of the circle with center of lat,lon (in km)
	* @return {Dock[]} - the array of docks within the circle with radius radius and center lat,lon
	*/
	static getNearbyDocks(lat, lon, radius) {
		var nearbyDocks = docks.filter(dock => {
			var dockLat = dock.latitude;
			var dockLon = dock.longitude;
			var earthRadius = 6371; // radius of the earth (km)
			var φ1 = Math.PI*lat/180;
			var φ2 = Math.PI*dockLat/180;
			var Δφ = Math.PI*(dockLat-lat)/180;
			var Δλ = Math.PI*(dockLon-lon)/180;

			var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
			        Math.cos(φ1) * Math.cos(φ2) *
			        Math.sin(Δλ/2) * Math.sin(Δλ/2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			var distance = earthRadius * c;  //distance between them
			return distance <= radius;
		});
		return nearbyDocks;

	}

	/**
	* Finds the duration from a location to all the nearby docks, with a radius of 1 km
	* @param {int} lat - the latitude of the location
	* @param {int} lon - the longitude of the location
	* @param {boolean} isOrigin - whether this location is origin or destination
	*/
	static getDurationToNearbyDocks(lat, lon, isOrigin, id) {
		var nearbyDocks = BlueMaps.getNearbyDocks(lat, lon, 1);
		if (isOrigin) {
			nearbyDocks = nearbyDocks.filter(dock => dock.numBikes >= 1);
		}
		else {
			nearbyDocks = nearbyDocks.filter(dock => dock.numSpaces >= 1);
		}
		var destinations = "";
		nearbyDocks.forEach(dock => {
			destinations += `${dock.latitude},${dock.longitude}|`;
		});
		destinations = destinations.substring(0, destinations.length-1);
		var origin = `${lat},${lon}`;
		var promise = new Promise(
			function(resolve, reject) {
				axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destinations}&key=${apikey}&mode=walking`)
					.then(res => {
						if (res.status === 200) {
							if (res.data === undefined || res.data.rows === undefined || 
								res.data.rows[0] === undefined || res.data.rows[0].elements === undefined) {
								reject("Could not get walking duration to nearby docks");
							}
							let elements = res.data.rows[0].elements
							elements.forEach((element, index) => {

							var stationID = nearbyDocks[index].stationID;
							var tripDuration = element.duration.value;
							var walkingDuration = {stationID, tripDuration};
							if (isOrigin) {
								concurrentMap[id].originDurations.push(walkingDuration);
							}
							else {
								concurrentMap[id].destinationDurations.push(walkingDuration);
							}
						})
						resolve();

						}
						else {
							reject("Coult not get walking duration to nearby docks");
						}
					})
					.catch(err => {
						console.log(err);
						console.log("error!")
						reject("Could not get walking duration to nearby docks");
					});
			})
		return promise;

	}

	/**
	* Finds the walking duration going directly from origin to destination
	* @param {int} originLat - the latitude of the origin location
	* @param {int} originLon - the longitude of the origin location
	* @param {int} destinationLat - the latitude of the destination location
	* @param {int} destinationLon - the longitude of the destination location
	*/
	static getDurationsDirectly(originLat, originLon, destinationLat, destinationLon, id) {
		var origin = `${originLat},${originLon}`;
		var destination = `${destinationLat},${destinationLon}`;
		var promise = new Promise(
			function(resolve, reject) {
				axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${apikey}&mode=walking`)
					.then(res => {
						if (res.status === 200) {
							let elements = res.data.rows[0].elements
							elements.forEach((element, index) => {
								var tripDuration = element.duration.value;
								concurrentMap[id].originToDestination = tripDuration;
							})
							resolve();
						}
						else {
							reject("Could not get walking durations directly");
						}
					})
					.catch(err => {
						console.log(err);
						console.log("error!")
						reject("Could not get walking durations directly");
					});
			})
		return promise;

	}

	static getDirections(startLat, startLon, endLat, endLon, travelMode) {
		var start = `${startLat},${startLon}`;
		var end = `${endLat},${endLon}`;
		var promise = new Promise(
			function(resolve, reject) {
				axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${end}&key=${apikey}&mode=${travelMode}`)
					.then(res => {
						if (res.status === 200) {
							let legs = res.data.routes[0].legs;
							let steps = legs[0].steps;
							let directions = [];
							steps.forEach(step => {
								directions.push(step.html_instructions);
							})
							console.log(directions);
							resolve(directions);
						}
						else {
							reject(["Could not get directions for this route!"]);
						}
					})
					.catch(err => {
						console.log(err);
						console.log("error!")
						reject(["Could not get directions for this route!"])
					});
			})
		return promise;
	}

	/**
	* Finds the lat, lon coordinates for the given address
	* @param {string} address - a human readable address
	* @param {(lat, lon) => {} } callback - a function that takes lat,lon
	*/
	static addressToLatLon(address, isOrigin, id) {
		var urlAddress = address.replace(" ", "+");
		var promise = new Promise(
			function(resolve, reject) {
				axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${urlAddress}&key=${apikey}`)
					.then(res => {
						if (res.status === 200) {
							var location = res.data.results[0].geometry.location;
							let shortName = res.data.results[0].formatted_address.split(',').splice(0,2).toString();
							if (isOrigin) {
								concurrentMap[id].originAddress = shortName;
							}
							else {
								concurrentMap[id].destinationAddress = shortName;
							}
							resolve(location);
						}
						else {
							reject("Could not convert address to map coordinates");
						}
					})
					.catch(err => {
						console.log(err);
						console.log("error!");
						reject("Could not convert address to map coordinates");
					});
			})
		return promise;
	}

	/**
	* Given two addresses, finds the shortest trip between these two addresses by finding the weights
	* of the graph, constructing the graph, and running Dijkstra on the graph
	* @param {string} originAddress - a human readable address of the origin
	* @param {string} destinationAddress - a human readable address of the destination
	*/
	static findShortestTrip(originAddress, destinationAddress, id) {
		var promise = new Promise(
			function(resolve, reject) {
				var errorFunction = function(errorStr) {
					reject(errorStr);
				}
				BlueMaps.addressToLatLon(originAddress, true, id).then(function(origin) {
					BlueMaps.getDurationToNearbyDocks(origin.lat, origin.lng, true, id).then(function() {
						BlueMaps.addressToLatLon(destinationAddress, false, id).then(function (destination) {
							BlueMaps.getDurationToNearbyDocks(destination.lat, destination.lng, false, id).then(function() {
								BlueMaps.getDurationsDirectly(origin.lat, origin.lng, destination.lat, destination.lng, id).then(function() {
									console.log('all done!');
									concurrentMap[id].originPos = origin;
									concurrentMap[id].destinationPos = destination;
									BlueMaps.findShortestPath(id);
									resolve();
								},
								errorFunction)
							},
							errorFunction)
						},
						errorFunction)
					},
					errorFunction)
				},
				errorFunction)
			});
		return promise;

	}

	/**
	* With the weights of the graph already found, will construct this graph and finds the shortest
	* path on this graph using Dijkstra, where a path must go through exactly two blue bike docks,
	* or go directly from start to finish
	* @returns {result} - a result object with a path (list of stops) in graph, a total time for entire path, 
	* 						and a list of individal times for each edge traversal
	*/
	static findShortestPath(id) {
		var graph = {};
		var start = {};
		var finish = {};
		start.finish = concurrentMap[id].originToDestination;
		concurrentMap[id].originDurations.forEach(walkingDuration => {
			start[walkingDuration.stationID + "_s"] = walkingDuration.tripDuration;
			graph[walkingDuration.stationID + "_s"] = {};
		});
		concurrentMap[id].destinationDurations.forEach(walkingDuration => {
			let finish = walkingDuration.tripDuration;
			graph[walkingDuration.stationID + "_f"] = {finish};
		});
		concurrentMap[id].originDurations.forEach(walkingOriginDuration => {
			concurrentMap[id].destinationDurations.forEach(walkingDestinationDuration => {
				var duration = BlueMaps.getDockDuration(walkingOriginDuration.stationID, walkingDestinationDuration.stationID);
				graph[walkingOriginDuration.stationID + "_s"][walkingDestinationDuration.stationID + "_f"] = duration;
			})
		});
		graph.start = start;
		graph.finish = finish;
		console.log(graph);
		var results = BlueMaps.dijkstra(graph);
		var distances = results.path.map((stop, index) => {
			if (index !== results.path.length - 1) {
				var next_stop = results.path[index+1];
				var time = graph[stop][next_stop];
				return time;
			}
			
		});
		results.distances = distances.slice(0, distances.length-1); //slice since last element will be undefined
		//remove the '_s' and '_f' added to differentiate nodes
		results.path = results.path.map(stop => stop.replace('_s', '').replace('_f', ''));
		concurrentMap[id].trip = results;
		return results;

	}

	/**
	* Helper function to Dijkstra
	*/
	static lowestCostNode(costs, processed) {
	  return Object.keys(costs).reduce((lowest, node) => {
	    if (lowest === null || costs[node] < costs[lowest]) {
	      if (!processed.includes(node)) {
	        lowest = node;
	      }
	    }
	    return lowest;
	  }, null);
	};

	/**
	* Dijkstra's algorithm, which returns the minimum cost and path to reach start to finish
	* on the given graph
	* @param {Graph} graph - a graph object 
	*/
	static dijkstra(graph) {

	  // track lowest cost to reach each node
	  const costs = Object.assign({finish: Infinity}, graph.start);

	  // track paths
	  const parents = {finish: null};
	  for (let child in graph.start) {
	    parents[child] = 'start';
	  }

	  // track nodes that have already been processed
	  const processed = [];

	  let node = BlueMaps.lowestCostNode(costs, processed);

	  while (node) {
	    let cost = costs[node];
	    let children = graph[node];
	    for (let n in children) {
	      let newCost = cost + children[n];
	      if (!costs[n]) {
	        costs[n] = newCost;
	        parents[n] = node;
	      }
	      if (costs[n] > newCost) {
	        costs[n] = newCost;
	        parents[n] = node;
	      }
	    }
	    processed.push(node);
	    node = BlueMaps.lowestCostNode(costs, processed);
	  }

	  let optimalPath = ['finish'];
	  let parent = parents.finish;
	  while (parent) {
	    optimalPath.push(parent);
	    parent = parents[parent];
	  }
	  optimalPath.reverse();

	  const results = {
	    distance: costs.finish,
	    path: optimalPath
	  };

	  return results;
	};

	/**
	* Performs the entire task of finding a single trip between originAddress to destinationAddress,
	* and formats the trip in a client-friendly way. Called by client to resolve trip
	* @param {string} originAddress - the address of the origin
	* @param {string} destinationAddress - the address of the destination
	*/
	static findTrip(originAddress, destinationAddress, id) {
		var promise = new Promise(
			function(resolve, reject) {
				if (!loaded) {
					BlueMaps.bootUp().then(function() {
						BlueMaps.loadDockStatus().then(function() {
							BlueMaps.findShortestTrip(originAddress, destinationAddress, id).then(function() {
								var tripAndPromises = BlueMaps.makeTrip(id);
								var formattedTrip = tripAndPromises[0];
								var promises = tripAndPromises[1];
								Promise.all(promises).then(function(values) {
									values.forEach((directions, index) => {
										formattedTrip.routes[index].directions = directions;
									})
									console.log(formattedTrip);
									resolve(formattedTrip);
								}).catch(error => {
									console.error(error.message);
								});
							},
							function(errorStr) {
								reject(errorStr);
							}) 
						})
					});
				}
				else {
					BlueMaps.loadDockStatus().then(function() {
						BlueMaps.findShortestTrip(originAddress, destinationAddress, id).then(function() {
							var tripAndPromises = BlueMaps.makeTrip(id);
							var formattedTrip = tripAndPromises[0];
							var promises = tripAndPromises[1];
							Promise.all(promises).then(function(values) {
								values.forEach((directions, index) => {
									formattedTrip.routes[index].directions = directions;
								})
								console.log(formattedTrip);
								resolve(formattedTrip);
							}).catch(error => {
								console.error(error.message);
							});
						},
						function(errorStr) {
							reject(errorStr);
						});
					})
				}
			})
		return promise;
		
	}
	/**
	* Performs the entire task of finding an entire trip between originAddress to destinationAddress,
	* involving 0 or more stops along the way, and formats the trip in a client-friendly way.
	* Called by client to resolve trip.
	* @param {string} originAddress - the address of the origin
	* @param {string} destinationAddress - the address of the destination
	* @param {[string]} stopAddresses - the address given as stops inbetween
	*/
	static findMultiStopTrip(email, originAddress, destinationAddress, stopAddresses) {
		var ids = [];
		//make the promise 
		var promise = new Promise(
			function(resolve, reject) {
				var start = originAddress;
				var endPoints = [];
				stopAddresses.forEach(address => {
					endPoints.push([start, address]);
					start = address
				});
				endPoints.push([start, destinationAddress]);
				var promises = endPoints.map(locations => {
					var origin = locations[0];
					var destination = locations[1];
					//make the id for this call
					var id = uuidv1();
					concurrentMap[id] = {originDurations: [], destinationDurations: [], };
					ids.push(id);
					return BlueMaps.findTrip(origin, destination, id);
				})
				Promise.all(promises).then(function(values) {
					BlueMaps.resetIDs(ids);
					var routes = [];
					var stops = [];
					var saved = {isSaved: false, id: ""};
					var stopID = 0;
					console.log('Values:');
					console.log(values);
					values.forEach((smallerTrip, index) => {
						var nonDocks = smallerTrip.stops.filter(stop => !stop.is_dock)
						if (nonDocks.length === 2 && nonDocks[0].name === nonDocks[1].name) {
							reject('Cannot have same stops in sequence.');
						}
						else if (index === 0) {
							routes = smallerTrip.routes;
							stops = smallerTrip.stops;
						}
						else {
							var preRoutes = smallerTrip.routes
							preRoutes.forEach(route => {
								route.stop1 += stopID;
								route.stop2 += stopID;
							});
							var preStops = smallerTrip.stops.filter((stop, index) => index !== 0);
							preStops.forEach(stop => {
								stop.id += stopID;
							});
							routes = routes.concat(preRoutes);
							stops = stops.concat(preStops);
						}
						stopID += smallerTrip.stops.length-1;
					});
					console.log(routes);
					console.log(stops);
					var originName = stops[0].name;
					var destinationName = stops[stops.length-1].name;
					if (email !== undefined && Account.findAccount(email) !== undefined) {
						var savedID = Account.isFavoriteTrip(email, originName, destinationName, stopAddresses.length+2);
						if (savedID !== false) {
							saved.isSaved = true;
							saved.id = savedID;
						}
					}
					console.log({routes, stops, saved});
					resolve({routes, stops, saved});

				}, function(errorStr) {
					BlueMaps.resetIDs(ids);
					reject(errorStr);
				}).catch(error => {
					BlueMaps.resetIDs(ids);
					console.error(error.message);
					reject('Could not plan this trip. Please make sure addresses are correct.');
				})
			})
		return promise;
		
	}

	/**
	* Resets the previously filled-in ids in the map, so the map doesn't grow
	*/
	static resetIDs(ids) {
		//reset values 
		ids.forEach(id => {
			delete concurrentMap[id];
		});
		
	}

	/**
	* Given the output from dijkstra, formats the trip into an object for client communication
	* @returns {Trip} - the trip object with routes and stops
	*/
	static makeTrip(id) {
		var originPos = concurrentMap[id].originPos;
		var destinationPos = concurrentMap[id].destinationPos;
		var originAddress = concurrentMap[id].originAddress;
		var destinationAddress = concurrentMap[id].destinationAddress;
		var trip = concurrentMap[id].trip;
		var stops = trip.path.map((stop, index) => {
			if (stop === 'start') {
				let stopObj = {id: index, lat: originPos.lat, lon: originPos.lng, is_dock: false, name: originAddress};
				return stopObj;
			}
			else if (stop === 'finish') {
				let destinationObj = {id: index, lat: destinationPos.lat, lon: destinationPos.lng, is_dock: false, name: destinationAddress};
				return destinationObj;
			}
			else { //dock stop
				return docks.filter(dock => dock.stationID === stop).map(dock => {return {id: index, lat: dock.latitude, lon: dock.longitude, is_dock: true, name: dock.name}})[0];
			}
		});
		var routes = [];
		var promises = trip.distances.map((distance, index) => {
			var type = "WALKING";
			var stopIndex = index;
			var routeStart = stops[stopIndex];
			var routeEnd = stops[stopIndex+1];
			if (routeStart.is_dock && routeEnd.is_dock) {
				//between two docks, the type is BICYCLING
				type = "BICYCLING";
			}
			var routeObj = {stop1: stopIndex, stop2: stopIndex+1, type, time: distance, directions: ["directions"]};
			routes.push(routeObj);
			return BlueMaps.getDirections(routeStart.lat, routeStart.lon, routeEnd.lat, routeEnd.lon, type.toLowerCase());
		})
		return [{routes, stops}, promises];
		

	}
	/**
	* Given a trip object, will re-generate the trip between the start and end locations
	* @param {Trip} trip - the favorite trip object to generate the trip of
	*/
	static startFavoriteTrip(trip) {
		var tripOrigin = trip.stops[0].name;
		var tripDestination = trip.stops[trip.stops.length-1].name;
		return BlueMaps.findTrip(tripOrigin, tripDestination);
	}



}

module.exports = BlueMaps;