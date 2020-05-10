<template>
    <!-- Please ignore this file! Used only for easy copy + pasting when creating new components. -->
    <div id="Panel" class='component'>
        <div id="top">
            <img src="../../resources/images/logo.png" v-on:click="switchToMap"/>

            <div id="address-input-form">
                <AddressInputForm/>
            </div>
            <div id="estimated-arrival-time" v-if="hasOngoingTrip">
                Estimated travel time: {{estimatedTravelTimeString}} minutes
            </div>

            <div v-if="!hasOngoingTrip" id="icons">
                <img src="../../resources/images/walk.png"/>
                <img src="../../resources/images/right.png"/>
                <img src="../../resources/images/bike.png"/>
                <img src="../../resources/images/right.png"/>
                <img src="../../resources/images/walk.png"/>
            </div>
        </div>
        <div id="directions">
            <DirectionsContainer/>
        </div>

        <div id="bottom">
            <button class="option" v-on:click="switchToMap">Map</button>
            <button class="option" v-if="!isSignedIn" v-on:click="switchToSignIn">Sign In</button>
            <button class="option" v-if="!isSignedIn" v-on:click="switchToCreateUser">Create User</button>
            <button class="option" v-if="isSignedIn" v-on:click="switchToSavedTrips">Saved Trips</button>
            <button class="option" v-if="isSignedIn" v-on:click="signOut">Sign Out</button>
        </div>

        <div id="description">
            BlueMaps is a travel planning service that helps you find the shortest path to travel from given start and destination locations (via riding Blue Bikes).
            Enter addresses in our address form in the top left hand corner to get started!
        </div>
    </div>
</template>

<script>
    import { store, actions, contentTitles } from "../store";
    import AddressInputForm from "./AddressInputForm";
    import DirectionsContainer from "./directions/DirectionsContainer";

    export default {
        name: "Panel",
        components: {
            AddressInputForm,
            DirectionsContainer
        },
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
            estimatedTravelTimeString() { return store.tripTimeString },
            contentTitles() { return contentTitles },
        },
        methods: {
            switchToSignIn() {
                actions.switchViewAction(contentTitles.SIGN_IN);
            },
            switchToMap() {
                actions.switchViewAction(contentTitles.HOME);
            },
            switchToCreateUser() {
                actions.switchViewAction(contentTitles.CREATE_USER);
            },
            switchToSavedTrips() {
                actions.switchViewAction(contentTitles.SAVED_TRIPS);
            },
            signOut() {
                actions.signOutAction();
            }
        }
    }
</script>

<style scoped>
    #description {
        font-style: italic;
    }

    #Panel {
      float: left;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-color: LightSalmon;
      max-width: 100%;
      height: 540px;
    }
    #Panel img {
      max-width: 100%;
      max-height: 100%;
      margin: auto;
      display: block;
    }
    #icons {
      display: flex;
      justify-content: space-around;
    }
    #icons img {
      width: 30px;
      height: 30px;
    }
    #bottom {
        display: flex;
        justify-content: space-around;
        flex-direction: column;
    }
    .option {
        margin: 4px;
        min-width: 160px;
        padding-top: 10px;
        padding-bottom: 10px;
        text-align: center;
        border-radius: 5px;
        border-style: none;
        background-color: white;
        color: black;
        cursor: pointer;
        font-size: 16px;
    }

    .option:hover {
        background-color: #ff6a2f;
        color: white;
    }

    .option:focus {
        outline: none;
    }

    #top img {
        pointer-events: none;
    }

    #address-input-form {
        padding-bottom: 10px;
    }

    #estimated-arrival-time {
        margin-top: 5px;
        font-size: 17px;
    }

</style>
