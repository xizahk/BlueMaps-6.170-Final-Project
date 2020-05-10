<template>
    <!-- Please ignore this file! Used only for easy copy + pasting when creating new components. -->
    <div id="saved-trips" class='component'>
        <div id='fav-trips-list'>
            <div v-if='trips.length'>
                <SavedTripsItem
                    v-for='trip in trips'
                    v-bind:key="trip.id"
                    v-bind:trip='trip.trip'
                    v-bind:id="trip.id"
                />
            </div>
            <div v-else id="message">
                <p>You have no saved trips. Start saving your favorite trips today!</p>
            </div>
        </div>
    </div>
</template>

<script>
    import { store } from "../../store";
    import SavedTripsItem from "./SavedTripsItem";

    export default {
        name: "SavedTrips",

        components: {SavedTripsItem},

        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
            trips() {return store.savedTrips}
        },
        methods: {
        }
    }
</script>

<style scoped>
    p {
        font-size: 20px;
        text-align: center;
    }
</style>