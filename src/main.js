import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faPowerOff, faStar, faFolder, faFolderOpen, faAngleLeft, faAnglesLeft, faAngleRight, faAnglesRight } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faPowerOff, faStar, faFolder, faFolderOpen, faAngleLeft, faAnglesLeft, faAngleRight, faAnglesRight)


createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
