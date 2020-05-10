<template>
    <div id="content-container" class="component">
        <!-- Only display title of the page if the page is not home (map ui)-->
        <h1 v-if="currentContent !== contentTitles.HOME" id="content-title"> {{currentContent}} </h1>
        <div id="header" v-else> </div>
        <div id="messages">
            <div class="message-container">
                <ErrorMessages/>
            </div>
            <div class="message-container">
                <SuccessMessages/>
            </div>
        </div>
        <div id="content">
            <!-- Home -->
            <div v-if="currentContent === contentTitles.HOME">
                <MapUI/>
            </div>
            <!-- Create User -->
            <div v-else-if="currentContent === contentTitles.CREATE_USER">
                <CreateUser/>
            </div>
            <!-- Sign In -->
            <div v-else-if="currentContent === contentTitles.SIGN_IN">
                <SignIn/>
            </div>
            <!-- Saved Trips -->
            <div v-else-if="currentContent === contentTitles.SAVED_TRIPS">
                <SavedTrips/>
            </div>
        </div>
    </div>
</template>

<script>
    import SavedTrips from "./account/SavedTrips"
    import MapUI from "./MapUI";
    import SignIn from "./account/SignIn"
    import CreateUser from "./account/CreateUser"
    import ErrorMessages from "./ErrorMessages";
    import SuccessMessages from "./SuccessMessages";
    import { store, contentTitles } from "../store";

    export default {
        name: "ContentContainer",
        components: {
            SavedTrips,
            ErrorMessages,
            SuccessMessages,
            MapUI,
            SignIn,
            CreateUser
        },
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
            contentTitles() { return contentTitles },
            currentContent() { return store.currentContent },
        },
        methods: {
        }
    }
</script>

<style scoped>
    h1 {
        display: flex;
        justify-content: center;
        color: black;
    }

    #header {
        height: 20px;
    }

    #messages {
        display: block;
        height: 5px;
        margin-top: -20px;
    }

    .message-container {
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 1000;
        pointer-events: none;
    }
</style>