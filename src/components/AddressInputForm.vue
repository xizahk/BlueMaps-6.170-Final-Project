<template>
    <div id="AddressInputForm" class='component'>
        <form id="address-form" v-on:submit.prevent="getTrip" method="post">
            <div id="address-list" v-for="(_, index) in inputAddresses" v-bind:key="index">
                <div class="address-entry">
                    <input type="text" class="address" placeholder="Enter address" v-model.trim="inputAddresses[index]"/>
                    <div v-if="showDeleteButton" class="delete-button" v-on:click="deleteAddress(index)"></div>
                    <div v-else class="delete-button-placeholder"></div>
                </div>
            </div>
            <div v-if="showAddButton" id="add-button" v-on:click="addAddress"></div>
            <input id="get-trip-button" type='submit' value="">
        </form>
    </div>
</template>

<script>
    import { store, actions } from "../store";

    export default {
        name: "AddressInputForm",
        computed: {
            hasOngoingTrip() { return store.hasOngoingTrip },
            inputAddresses() { return store.inputAddresses },
            showDeleteButton() { return store.inputAddresses.length > 2 },
            showAddButton() { return store.inputAddresses.length < 5 }
        },
        data() {
            return {
            };
        },
        methods: {
            /* Functions below should be moved to store */
            deleteAddress: function(index) {
                store.inputAddresses.splice(index, 1);
            },
            addAddress: function() {
                store.inputAddresses.push("");
            },
            /* Move functions above to store when possible */
            getTrip: function() {
                if (this.start === "" || this.end === "") {
                    actions.addAndDeleteErrorMessage("Please enter both start and end locations!");
                } else {
                    actions.getTripAction(store.inputAddresses.filter(address => address.length > 0));
                }
            },
            resetForm: function() {
                this.start = "";
                this.end = "";
            }
        }
    }
</script>

<style scoped>
    .address {
        display: flex;
        justify-content: space-around;
        background-color: white;
        padding: 5px;
        width: 255px;
        height: 30px;
        cursor: text;
        border-radius: 5px;
        border-style: none;
        margin-bottom: 3px;
        font-size: 16px;
    }

    .address:focus {
        outline-width: 3px;
        outline-color: dodgerblue;
    }

    .address-entry {
        display: grid;
        grid-template-columns: 85% 15%;
        padding-bottom: 3px;
    }

    .delete-button {
        background: url("../../resources/images/delete_button.png") no-repeat center;
        background-size: 25px;
        position: relative;
        left: 5px;
        cursor: pointer;
    }

    #add-button {
        width: 30px;
        height: 30px;
        background: url("../../resources/images/add_button2.png") no-repeat center;
        background-size: 30px;
        margin-left: 45%;
        cursor: pointer;
    }

    #get-trip-button {
        display: none;
        width: 50px;
        height: 50px;
        border: 0px;
        background: url("../../resources/images/enter.png") no-repeat center;
        background-size: 45px;
    }
</style>
