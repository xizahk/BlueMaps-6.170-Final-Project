<template>
    <div id="DirectionsContainer" class='component'>
        <ol id="directions-list">
            <li class="direction-entry" v-for="route in routes" v-bind:key="route">
                <DirectionEntry
                    :route="route"
                />
            </li>
        </ol>
    </div>
</template>

<script>
    import DirectionEntry from "./DirectionEntry";
    import { store, mutations, actions } from "../../store";

    export default {
        name: "DirectionsContainer",
        components: {
            DirectionEntry
        },
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
            routes() { return store.routes }
        },
        methods: {
        }
    }
</script>

<style scoped>
    li {
        margin-left: -20px;
    }
    .end-trip-button {
        display: flex;
        margin-left: 50%;
    }

</style>