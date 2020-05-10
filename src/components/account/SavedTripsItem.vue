<template>
    <!-- Please ignore this file! Used only for easy copy + pasting when creating new components. -->
    <div id="saved-trips-item" class='component'>
        <div class="padding"></div>
        <button id="delete-button" v-on:click="deleteSavedTrip"> <img src="../../../resources/images/recycle-bin.png" /> </button>
        <div id="saved-trip-info" v-on:click="startTrip" >
            <div id='fav-trip' >
                <p> {{trip.stops[0].name}} </p>
                <img id="right" src="../../../resources/images/right.png"/>
                <p> {{trip.stops[trip.stops.length-1].name}} </p>
            </div>
            <div id='column'>
                <div></div>
                <div id='time-section'>
                    <img src="../../../resources/images/time.png"/>
                    <span> {{trip.time}} minutes </span>
                </div>
                <div id='stop-section'>
                    <img src="../../../resources/images/location.png"/>
                    <span> {{trip.stops.length}} stops </span>
                </div>
                <div></div>
            </div>
        </div>
        <div class="padding"></div>
    </div>
</template>

<script>
    import { store, mutations, actions } from "../../store";

    export default {
        name: "SavedTripsItem",
        props: {
            trip: {},
            id: ""
        },
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
        },
        methods: {
            startTrip: function() {

                actions.getTripAction(this.trip.stops.filter(stop => !stop.is_dock).map(stop => stop.name));
            },
            deleteSavedTrip: function() {
                if (confirm("Are you sure you want to delete this trip?")) {
                    actions.deleteSavedTrip(this.id);
                }
            }
        }
    }
</script>

<style scoped>
    #saved-trips-item {
        display: grid;
        grid-template-columns: 10% 5% 75% 10%;
    }

    #saved-trip-info {
        display: grid;
        grid-template-columns: 3fr 1fr;

        border: 2px solid white;
        border-radius: 4px;
        background-color: transparent;
    }

    #saved-trip-info:hover {
        background-color: white;
    }

    #fav-trip {
        display: flex;
        justify-content: space-between;
        padding: 5px 5px 5px 5px;
        margin-top: 10px;
        cursor: pointer;
        width: 550px;
        font-size: 20px;
    }

    #column {
        display: grid;
        grid-template-rows: 5% 45% 45% 5%;
        margin-top: 5px;
        padding-left: 5%;
        font-size: 20px;
        align-content: center;
    }

    img {
        margin-top:7px;
        max-width: 15px;
    }
    #delete-button img {
        max-width: 25px;
    }
    #delete-button {
        border: transparent;
        background-color: transparent;
        border-radius: 4px;
        cursor: pointer;
    }
    #delete-button:hover {
        background-color: #ff726f;
    }

    #delete-button:focus {
        outline: 0;
    }

    #right {
        max-width: 40px;
        max-height: 40px;
    }
</style>