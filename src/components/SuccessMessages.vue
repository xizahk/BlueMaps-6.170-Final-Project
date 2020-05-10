<template>
    <div v-if="hasMessage" id="success-messages" class="component">
        <ul id="message-list">
            <li class="message" v-for='message in messages' v-bind:key='message.id'>{{ message }}</li>
        </ul>
    </div>
</template>

<script>
    import { store } from "../store";
    export default {
        name: "SuccessMessages",
        computed: {
            hasMessage() { return store.successes.length > 0 },
            messages() { return store.successes },
        },
    }
</script>

<style scoped>
    #success-messages {
        display: flex;
        flex-wrap: wrap;
        color: green;
        background-color: rgba(255, 255, 255, .9);
        border: 2px solid lightsalmon;
        border-radius: 5px;
        position: relative;
        top: 10px;
    }

    #message-list {
        list-style: none;
        padding-left: 10px;
        padding-right: 10px;
        opacity: 1;
        font-size: 20px;
    }
</style>