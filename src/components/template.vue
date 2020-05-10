<template>
    <!-- Please ignore this file! Used only for easy copy + pasting when creating new components. -->
    <div id="" class='component'>

    </div>
</template>

<script>
    import axios from "axios";
    import { store, mutations, actions } from "../store";

    export default {
        name: "",
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
        },
        methods: {
        }
    }
</script>

<style scoped>
</style>