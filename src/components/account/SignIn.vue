<template>
    <!-- Please ignore this file! Used only for easy copy + pasting when creating new components. -->
    <div id="sign-in" class='component'>
        <form v-if="!isSignedIn" v-on:submit.prevent="signIn" method="post">
            <div class="form-group">
                <div class="padding"> </div>
                <div class="group">
                    <input class="input-text" type="text" v-model.trim='email' required>
                    <span class="highlight"></span>
                    <span class="bar"></span>
                    <label>Email</label>
                </div>

                <div class="group">
                    <input class="input-text" type="text" v-model.trim="password" required>
                    <span class="highlight"></span>
                    <span class="bar"></span>
                    <label>Password</label>
                </div>
            </div>

            <input class="submit-button" type='submit' value='Sign In'>
        </form>
        <div v-else>
            Error: unexpected access to this page.
        </div>
    </div>
</template>

<script>
    import { store, actions } from "../../store";

    export default {
        name: "SignIn",
        computed: {
            isSignedIn() { return store.isSignedIn },
            hasOngoingTrip() { return store.hasOngoingTrip },
        },
        data: function() {
          return {
              email: "",
              password: ""
          }
        },
        methods: {
            signIn: function() {
                actions.signInAction(this.email, this.password);
                this.resetForm();
            },
            resetForm: function() {
                this.email = "";
                this.password = "";
            }
        }
    }
</script>

<style scoped>
    #sign-in {
        display: flex;
        justify-content: center;
    }

    .form-group {
        width: 100%;
    }

    .form-group label {
        width: 20%;
        clear: both;
    }

    .padding {
        height: 30px;
    }

    /* form starting stylings ------------------------------- */
    .group        {
        position:relative;
        margin-bottom:45px;
    }

    input {
        font-size:18px;
        padding:15px 10px 15px 5px;
        display:block;
        width:300px;
        border:none;
        border-radius: 5px;
        border-bottom:1px solid #757575;
    }

    input:focus {
        outline:none;
    }

    label          {
        color:#999;
        font-size:18px;
        font-weight:normal;
        position:absolute;
        pointer-events:none;
        left:5px;
        top:10px;
        transition:0.2s ease all;
    }

    /* active state */
    input:focus ~ label, input:valid ~ label     {
        top:-20px;
        font-size:14px;
        color:#5264AE;
    }

    /* BOTTOM BARS ================================= */
    .bar  { position:relative; display:block; width:315px; }
    .bar:before, .bar:after   {
        content:'';
        height:2px;
        width:0;
        bottom:1px;
        position:absolute;
        background:#5264AE;
        transition:0.2s ease all;
    }
    .bar:before {
        left:50%;
    }
    .bar:after {
        right:50%;
    }

    /* active state */
    input:focus ~ .bar:before, input:focus ~ .bar:after {
        width:50%;
    }

    /* HIGHLIGHTER ================================== */
    .highlight {
        position:absolute;
        height:60%;
        width:100px;
        top:25%;
        left:0;
        pointer-events:none;
        opacity:0.5;
    }

    /* active state */
    input:focus ~ .highlight {
        animation:inputHighlighter 0.3s ease;
    }

    /* ANIMATIONS ================ */
    @keyframes inputHighlighter {
        from  { background:#5264AE; }
        to    { width:0; background:transparent; }
    }

    /* active state */
    input:focus ~ label, input:valid ~ label {
        top:-20px;
        font-size:14px;
        color:#5264AE;
    }

    .submit-button {
        padding: 10px;
    }
</style>