import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import {i18n} from './locales/i18n.js'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
createApp(App).use(i18n).use(Antd).mount('#app'); // 注入国际化函数$t

