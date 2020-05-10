import Vue from 'vue'
import App from './App.vue'
import SmoothScrollbar from 'vue-smooth-scrollbar'
import * as VueGoogleMaps from 'vue2-google-maps'

Vue.use(SmoothScrollbar);
Vue.use(VueGoogleMaps, {
  load: {
    key: 'Insert-key-here',
    libraries: 'places',
  },
});

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount('#app');