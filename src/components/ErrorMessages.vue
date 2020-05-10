<template>
    <div v-if="hasError" id="error-messages" class="component">
        <ul id="error-list">
            <li class="error" v-for='error in errors' v-bind:key='error.id'>{{ error }}</li>
        </ul>
    </div>
</template>

<script>
    import { store } from "../store";
    export default {
        name: "ErrorMessages",
        computed: {
            hasError() { return store.errors.length > 0 },
            errors() { return store.errors },
        },
    }
</script>

<style scoped>
    #error-messages {
        display: flex;
        flex-wrap: wrap;
        color: red;
        background-color: rgba(255, 255, 255, .9);
        border: 2px solid lightsalmon;
        border-radius: 5px;
        position: relative;
        top: 10px;
    }

    #error-list {
        list-style: none;
        padding-left: 10px;
        padding-right: 10px;
        opacity: 1;
        font-size: 20px;
    }
</style>