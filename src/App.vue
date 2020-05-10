<template>
    <div id="App" class="component">
        <!-- Two columns below: Panel | Map -->
        <div id="columns">
          <div id="scroll-area">
              <smooth-scrollbar>
                  <Panel/>
              </smooth-scrollbar>
          </div>
          <div id="content-container">
              <ContentContainer/>
          </div>
        </div>
    </div>
</template>

<script>
    import { store, mutations } from "./store";
    import ContentContainer from "./components/ContentContainer";
    import Panel from "./components/Panel";
    import ErrorMessages from "./components/ErrorMessages";
    import axios from "axios";

    export default {
        name: "App",
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
        },
        created: function() {
            axios
                .get("/api/account", {})
                .then((res) => {
                    mutations.signIn(res);
                })
                .catch(() => {
                    // client has not logged in before, so don't sign in and don't log the err
                })
        },
        components: {
            ContentContainer,
            Panel,
            ErrorMessages
        }
    }
</script>

<style>
    .submit-button {
        width: 150px;
        height: 40px;
        font-size: 18px;
        margin-top: 10px;
        border-style: none;
        background-color: white;
        border-radius: 4px;
    }

    .submit-button:hover {
        background-color: #ff6a2f;
        color: white;
    }
</style>

<style scoped>
    #App {
        width: 99vw;
        height: 95vh;
        margin-bottom:-155px;
    }

    #scroll-area {
        width: 300px;
        height: 97vh;
    }

    Panel {
        width: 300px;
    }

    #columns {
        display: grid;
        grid-template-columns: 300px 1fr;
    }

</style>
