<template>
    <div id="DirectionEntry" class='component'>
        <div id="summary" v-on:click="toggleShowSteps">
            <span class="name"> {{(showSteps) ? startName : shortStartName}} </span>
            <img src="../../../resources/images/right.png"/>
            <span class="name"> {{(showSteps) ? endName : shortEndName}} </span>
            <img v-if="type==='WALKING'" src="../../../resources/images/walk.png"/>
            <img v-else src="../../../resources/images/bike.png"/>
        </div>
        <div v-if="showSteps" id="steps">
            <div id="time"> Time: {{timeString}} minutes </div>
            <ul>
                <li v-for="dir in directions">
                    <div id="stepItem" v-html="dir"> </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import { store, mutations, actions, utils } from "../../store";

    export default {
        name: "DirectionEntry",
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
            type() { return this.route.type },
            startName() { return store.stops.get(this.route.stop1).name },
            shortStartName() { return utils.shortenString(this.startName, this.numChars)},
            endName() { return store.stops.get(this.route.stop2).name },
            shortEndName() { return utils.shortenString(this.endName, this.numChars)},
            time() { return this.route.time },
            timeString() { return utils.convertSecondsToTimeString(this.time)},
            directions() { return this.route.directions }
        },
        data: function() {
            return {
                showSteps: false,
                numChars: 20
            }
        },
        props: {
            route: {}
        },
        methods: {
            toggleShowSteps() {
                this.showSteps = !this.showSteps;
            }
        }
    }
</script>

<style scoped>
    #DirectionEntry {
        background-color: #ffd7c7;
        padding: 2px 2px 2px 2px;
        border: 3px solid lightsalmon;
        border-radius: 5px;
        margin-bottom: 5px;
        margin-right: 2px;
    }

    #DirectionEntry:hover {
        border-style: solid;
        border-color: #ff6a2f;
    }

    img {
        width: 25px;
        height: 25px;
    }

    .name {
        display: flex;
        flex-wrap: wrap;
    }

    #summary {
        display: grid;
        grid-template-columns: 2fr 1fr 2fr 1fr;
        cursor: pointer;
    }
</style>