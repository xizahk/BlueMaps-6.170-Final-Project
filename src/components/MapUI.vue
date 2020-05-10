<template>
    <div id="MapUI" class="component">

        <div id="show-overlay" v-if="showOverlay">
            <div id="overlay">
                <Loading id="loading_image"/>
            </div>
        </div>
        <div class="buttons-container" v-if="isSignedIn && hasOngoingTrip">
            <div v-if="isTripSaved" id="heart-filled" class="overlay-button-on" v-on:click="unsaveTrip"></div>
            <div v-else id="heart-empty" class="overlay-button-on" v-on:click="saveTrip"></div>
            <div id="send-email" class="overlay-button-on" v-on:click="sendEmail"></div>
        </div>
        <div class="buttons-container" v-if="hasOngoingTrip">
            <div id='end-trip' class='overlay-button-on' v-on:click="endTrip"> </div>
        </div>
        <div class="buttons-container" v-else>
            <div v-if="isBikeMode" id="switch-to-dock" class='overlay-button-on' v-on:click="toggleDockDisplayMode"></div>
            <div v-else id="switch-to-bike"class='overlay-button-on' v-on:click="toggleDockDisplayMode"></div>
        </div>

        <div id="google-map">
            <GmapMap ref="mapRef"
                     :center="{lat:42.3593024, lng:-71.0594703}"
                     :zoom="15"
                     :streetViewControl= false
                     map-type-id="terrain"
                     style="width:100%; height:97vh;"
            >
                <GmapMarker
                        :key="index"
                        v-for="(m, index) in markers"
                        :position="m.position"
                        :title='m.title'
                        :clickable="true"
                        :label="(index+1)+''"
                        @click="m.click"
                />
                <GmapMarker
                        v-for="(d, index) in goodDocks"
                        :position="d.position"
                        :icon="d.icon"
                        :title="d.title"
                        @click="d.click"
                />
                <GmapMarker
                        v-for="(d, index) in mediumDocks"
                        :position="d.position"
                        :icon="d.icon"
                        :title="d.title"
                        @click="d.click"
                />
                <GmapMarker
                        v-for="(d, index) in badDocks"
                        :position="d.position"
                        :icon="d.icon"
                        :title="d.title"
                        @click="d.click"
                />
            </GmapMap>
        </div>
    </div>
</template>

<script>
    import { store, actions } from "../store";
    import {gmapApi} from 'vue2-google-maps';
    import EventBus from '../event-bus';
    import Loading from './Loading';

    export default {
        name: "MapUI",
        components: {
            Loading
        },
        computed: {
            isTripSaved() { return store.isTripSaved },
            startLocation() { return store.startLocation },
            endLocation() { return store.endLocation },
            hasOngoingTrip() { return store.hasOngoingTrip },
            isSignedIn() { return store.isSignedIn },
            stops() { return store.stops },
            routes() { return store.routes },
            isBikeMode() { return store.isBikeMode },
            infoWindow() {
                if (this.infowindow === undefined) {
                    this.infowindow = new google.maps.InfoWindow();
                }
                return this.infowindow;
            },
            markers() {
                var unique = {};
                return [...store.stops.values()].filter(stop => {
                    var latLonStr = stop.lat + "," + stop.lon;
                    if (!unique[latLonStr]) {
                        unique[latLonStr] = true;
                        return !stop.is_dock;
                    }
                    else {
                        return false;
                    }
                }).map(stop => {
                    return {
                        position: {lat: stop.lat, lng: stop.lon},
                        click: () => {
                            var contentStr = `<div> <b> ${stop.name} </b> </div>`;
                            let map = this.$refs.mapRef.$mapObject;
                            this.infoWindow.setContent(contentStr);
                            this.infoWindow.setPosition({lat: stop.lat, lng: stop.lon});
                            this.infoWindow.open(map);
                        },
                    }
                })
            },
            dockMarkers() {
                return [...store.stops.values()].filter(stop => stop.is_dock).map((stop, index) => {
                    let dock = store.docks.filter(dock=> dock.latitude === stop.lat && dock.longitude === stop.lon)[0];
                    // determine the icon of the dock
                    let is_bike_mode = index % 2 === 0;
                    let amount_left = (is_bike_mode) ? dock.numBikes : dock.numSpaces;
                    let dock_type = (amount_left / dock.capacity >= 0.5) ? 'good' : 'medium';
                    let icon_src = this.getIconSrc(is_bike_mode, dock_type);
                    return {
                        position: {lat: stop.lat, lng: stop.lon},
                        title: stop.name,
                        click: () => {
                            // generate context string for the marker
                            var contentStr = `<div> <b> ${dock.name} </b> </div>`;
                            if (index % 2 !== 0) {
                                //slots
                                var slotNumber = (dock.numSpaces === 1) ? "empty slot" : "empty slots";
                                contentStr += `<div> ${dock.numSpaces} ${slotNumber} </div>`;
                            }
                            else {
                                //bikes
                                var bikeNumber = (dock.numBikes === 1) ? "bike available" : "bikes available";
                                contentStr += `<div> ${dock.numBikes} ${bikeNumber} </div>`;
                            }
                            contentStr += `<div> ${dock.capacity} total capacity </div>`;
                            let map = this.$refs.mapRef.$mapObject;
                            this.infoWindow.setContent(contentStr);
                            this.infoWindow.setPosition({lat: dock.latitude, lng: dock.longitude});
                            this.infoWindow.open(map);
                        },
                        icon: icon_src
                    }
                })
            },
            goodDocks() {
                if (this.dockMarkers.length !== 0) {
                    return this.dockMarkers.filter((stop, index) => {
                        function isGood(dock, dockMarkers) {
                            //check if have more than half spaces open, and is not already a medium dock
                            return ((index % 2 !== 0) ? dock.numSpaces/dock.capacity >= 0.5 : dock.numBikes/dock.capacity >= 0.5) && dockMarkers.filter((stop, stopIndex) => stop.position.lat === dock.latitude && stop.position.lng === dock.longitude && stopIndex % 2 !== index % 2).length === 0;
                        }

                        var dock = store.docks.filter(dock => dock.latitude === stop.position.lat && dock.longitude === stop.position.lng && isGood(dock, this.dockMarkers))[0];
                        return dock !== undefined;
                    })
                }
                else {
                    let icon_src = this.getIconSrc(this.isBikeMode, 'good');
                    let isBikeMode = this.isBikeMode;
                    function filterFunc(dock) {
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        return amount_left / dock.capacity >= 0.5;
                    }
                    return store.docks.filter(filterFunc).map(dock => {
                        // Generate content string for the dock
                        let contentStr = `<div> <b> ${dock.name} </b> </div>`;
                        let bikeNumber = "";
                        if (isBikeMode) {
                            bikeNumber = (dock.numBikes === 1) ? "bike available" : "bikes available";
                        } else {
                            bikeNumber = (dock.numSpaces === 1) ? "slot available" : "slots available";
                        }
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        contentStr += `<div> ${amount_left} ${bikeNumber} </div>`;
                        contentStr += `<div> ${dock.capacity} total capacity </div>`;

                        return {
                            position: {lat: dock.latitude, lng: dock.longitude},
                            icon: icon_src,
                            title: dock.name,
                            numBikes: dock.numBikes,
                            numSpaces: dock.numSpaces,
                            click: () => {
                                let map = this.$refs.mapRef.$mapObject;
                                this.infoWindow.setContent(contentStr);
                                this.infoWindow.setPosition({lat: dock.latitude, lng: dock.longitude});
                                this.infoWindow.open(map);
                            },
                        }
                    })
                }
            },
            mediumDocks() {
                if (this.dockMarkers.length !== 0) {
                    return this.dockMarkers.filter((stop, index) => {
                        function isMedium(dock) {
                            return (index % 2 !== 0) ? dock.numSpaces/dock.capacity < 0.5 && dock.numSpaces/dock.capacity > 0 : dock.numBikes/dock.capacity < 0.5 && dock.numBikes/dock.capacity > 0;
                        }
                        var dock = store.docks.filter(dock => dock.latitude === stop.position.lat && dock.longitude === stop.position.lng && isMedium(dock))[0];
                        return dock !== undefined;
                    })
                }
                else {
                    let icon_src = this.getIconSrc(this.isBikeMode, 'medium');
                    // filter based on whether the current display mode is for bikes or slots
                    let isBikeMode = this.isBikeMode;
                    function filterFunc(dock) {
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        return amount_left / dock.capacity < 0.5 && amount_left/dock.capacity > 0;
                    }
                    return store.docks.filter(filterFunc).map(dock => {
                        let contentStr = `<div> <b> ${dock.name} </b> </div>`;
                        let bikeNumber = "";
                        if (isBikeMode) {
                            bikeNumber = (dock.numBikes === 1) ? "bike available" : "bikes available";
                        } else {
                            bikeNumber = (dock.numSpaces === 1) ? "slot available" : "slots available";
                        }
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        contentStr += `<div> ${amount_left} ${bikeNumber} </div>`;
                        contentStr += `<div> ${dock.capacity} total capacity </div>`;
                        return {
                            position: {lat: dock.latitude, lng: dock.longitude},
                            title: dock.name,
                            numBikes: dock.numBikes,
                            numSpaces: dock.numSpaces,
                            icon: icon_src,
                            click: () => {
                                let map = this.$refs.mapRef.$mapObject;
                                this.infoWindow.setContent(contentStr);
                                this.infoWindow.setPosition({lat: dock.latitude, lng: dock.longitude});
                                this.infoWindow.open(map);
                            },
                        }
                    })
                }
            },
            badDocks() {
                if (this.dockMarkers.length !== 0) {
                    return this.dockMarkers.filter((stop, index) => {
                        function isBad(dock) {
                            return (index % 2 !== 0) ? dock.numSpaces/dock.capacity === 0 : dock.numBikes/dock.capacity === 0;
                        }
                        var dock = store.docks.filter(dock => dock.latitude === stop.position.lat && dock.longitude === stop.position.lng && isBad(dock))[0];
                        return dock !== undefined;
                    })
                }
                else {
                    let icon_src = this.getIconSrc(this.isBikeMode, 'bad');
                    // filter based on whether the current display mode is for bikes or slots
                    let isBikeMode = this.isBikeMode;
                    function filterFunc(dock) {
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        return amount_left/dock.capacity === 0;
                    }

                    return store.docks.filter(filterFunc).map(dock => {
                        let contentStr = `<div> <b> ${dock.name} </b> </div>`;
                        let bikeNumber = "";
                        if (isBikeMode) {
                            bikeNumber = (dock.numBikes === 1) ? "bike available" : "bikes available";
                        } else {
                            bikeNumber = (dock.numSpaces === 1) ? "slot available" : "slots available";
                        }
                        let amount_left = (isBikeMode) ? dock.numBikes : dock.numSpaces;
                        contentStr += `<div> ${amount_left} ${bikeNumber} </div>`;
                        contentStr += `<div> ${dock.capacity} total capacity </div>`;
                        return {
                            icon: icon_src,
                            position: {lat: dock.latitude, lng: dock.longitude},
                            title: dock.name,
                            numBikes: dock.numBikes,
                            numSpaces: dock.numSpaces,
                            click: () => {
                                let map = this.$refs.mapRef.$mapObject;
                                this.infoWindow.setContent(contentStr);
                                this.infoWindow.setPosition({lat: dock.latitude, lng: dock.longitude});
                                this.infoWindow.open(map);
                            },
                        }
                    })
                }
            },
            showOverlay() {
              return store.showOverlay;
            },
            google: gmapApi,
        },
        data() {
            return {
                infowindow : undefined,
            };
        },
        mounted: function() {
            EventBus.$on('renderRoutes',  () => {
                this.clearDirections();
                let vm = this;
                let map = this.$refs.mapRef.$mapObject;
                let bounds = new google.maps.LatLngBounds();
                vm.directionsService = new google.maps.DirectionsService();
                vm.directionsDisplays = [];

                var lineSymbol = {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 4
                };
                var bikingOptions = {
                    strokeColor: "blue",
                    strokeOpacity: 0.7,
                    strokeWeight: 5,
                    scale: 4,
                };
                var walkingOptions = {
                    strokeColor: "red",
                    strokeOpacity: 0,
                    strokeWeight: 5,
                    scale: 4,
                    icons: [{
                        icon: lineSymbol,
                        offset: 0,
                        repeat: "20px",
                    }]
                };

                for (let i = 0; i < this.routes.length; i++) {
                    let route = this.routes[i];
                    let prev = this.stops.get(route.stop1);
                    let next = this.stops.get(route.stop2);
                    let type = route.type;
                    let directionsDisplay = new google.maps.DirectionsRenderer({
                        preserveViewport: true,
                        polylineOptions: (type === "WALKING") ? walkingOptions: bikingOptions,
                        suppressMarkers: true,
                        suppressBicyclingLayer: true,
                    });
                    directionsDisplay.setMap(map);
                    vm.directionsService.route({
                        origin: {lat: prev.lat, lng: prev.lon},
                        destination: {lat: next.lat, lng: next.lon},
                        travelMode: type,
                    }, function(response, status) {
                        if (status === 'OK') {
                            directionsDisplay.setDirections(response);
                            vm.directionsDisplays.push(directionsDisplay);
                            map.fitBounds(bounds.union(response.routes[0].bounds))
                        } else {
                            let msg = 'Directions request failed due to ' + status;
                            actions.addAndDeleteErrorMessage(msg);
                        }
                    });
                }
            }); 
            this.getDocks();
        },
        methods: {
            toggleDockDisplayMode: function() {
                actions.toggleBikeModeAction();
            },
            endTrip: function() {
                actions.endTrip();
                this.clearDirections();
            },
            clearDirections: function() {
                if (this.directionsDisplays) {
                    this.directionsDisplays.forEach(display => {
                        display.set('directions', null);
                    });
                }
            },
            saveTrip: function() {
                actions.saveTripAction();
            },
            unsaveTrip: function() {
                actions.unsaveTripAction();
            },
            sendEmail: function() {
                actions.sendEmail();
            },
            getDocks: function() {
                actions.getDocks();
            },
            getIconSrc: function(is_bike_mode, dock_type) {
                if (is_bike_mode) {
                    switch (dock_type) {
                        case 'good':
                            return "https://i.imgur.com/Ns3wpzM.png";
                        case 'medium':
                            return "https://i.imgur.com/O93oXWu.png";
                        case 'bad':
                            return "https://i.imgur.com/JLPZCug.png";
                    }
                } else {
                    switch (dock_type) {
                        case 'good':
                            return "https://i.imgur.com/bQPPlnS.png";
                        case 'medium':
                            return "https://i.imgur.com/Nibejmw.png";
                        case 'bad':
                            return "https://i.imgur.com/2ILtdI2.png";
                    }
                }
            }
        }
    }
</script>


<style scoped>
    #show-overlay {
        display: block;
        height: 0px;
    }

    #overlay {
        background-color: rgba(255, 255, 255, .5);
        position: relative;
        max-width: 100%;
        height: 97vh;
        z-index: 1010;
    }

    #loading_image {
        position: relative;
        left: 43%;
        top: 40%;
        height: 100px;
        width: 100px;
    }

    #MapUI {
        background-color: pink;
        max-width: 100%;
        max-height: 100%;
        margin-left: auto;
        margin-right: auto;
        display: block;
    }

    #map-with-trip {
        display: flex;
        justify-content: center;
    }

    .buttons-container {
        display: block;
        height: 1px;
    }

    #end-trip-container {
        display: block;
        height: 1px;
    }

    .overlay-button-on {
        display: flex;
        justify-content: center;
        cursor: pointer;
        position: relative;
        top: 100px;
        left: 20px;
        height: 100px;
        width: 100px;
        z-index: 1000;
    }

    #heart-filled {
        background: url("../../resources/images/heart_filled.png") no-repeat;
        background-size: 100px;
    }

    #heart-empty {
        background: url("../../resources/images/heart_empty.png") no-repeat;
        background-size: 100px;
    }

    #send-email {
        background: url("../../resources/images/send_email.png") no-repeat;
        background-size: 100px;
    }

    #end-trip {
        background: url("../../resources/images/delete_button.png") no-repeat;
        background-size: 100px;
        position: relative;
        top: 80vh;
    }

    #switch-to-dock {
        background: url("../../resources/images/dock_button.png") no-repeat;
        background-size: 100px;
    }

    #switch-to-bike {
        background: url("../../resources/images/bike_button.png") no-repeat;
        background-size: 100px;
    }
</style>
