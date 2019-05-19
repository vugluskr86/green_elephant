<template>
<div id="map_overlay">  
    <modal :show.sync="modals.modal1">
        <base-input alternative
                    v-model="username"
                    class="mb-3"
                    placeholder="Ваше имя"
                    addon-left-icon="ni ni-circle-08">
        </base-input>
        <base-button type="primary" @click="modals.modal1 = false; auth()">Войти</base-button>
    </modal>

    

    <yandexMap
    :settings="settings"
    :coords="[56.8389, 60.6057]"
    zoom="13"
    :controls="['geolocationControl', 'zoomControl']"
    >
    <ymap-marker
      marker-id="3"
      marker-type="circle"
      :coords="[56.81781849775358,60.56990860290527]"
      circle-radius="1000"
      hint-content="Hint content 1"
      :marker-fill="{color: '#70F584', opacity: 0.4}"
      :marker-stroke="{color: '#1F752C', width: 1}"
      :balloon="{header: 'header', body: 'body', footer: 'footer'}"
    ></ymap-marker>

    <ymap-marker
      marker-id="3"
      marker-type="circle"
      :coords="[56.83683002289383, 60.686466677856465]"
      circle-radius="1000"
      hint-content="Hint content 1"
      :marker-fill="{color: '#F5EE26', opacity: 0.4}"
      :marker-stroke="{color: '#F59726', width: 1}"
      :balloon="{header: 'header', body: 'body', footer: 'footer'}"
    ></ymap-marker>
    </yandexMap>
</div>
</template>

<script>

    const settings = { // you may define your apiKey, lang and version or skip this.
    apiKey: '84ccd37e-2b5d-4d86-959f-299371371e0a',
    lang: 'ru_RU',
    version: '2.1'
    }

    import Vue from 'vue'
    import { yandexMap, ymapMarker } from 'vue-yandex-maps'
    import Modal from "@/components/Modal.vue";


    export default {
        name: "home",
        components: { yandexMap, ymapMarker, Modal },
        data () {
            return {
                username: null,
                isAuth: false,
                settings : { // you may define your apiKey, lang and version or skip this.
                    apiKey: '84ccd37e-2b5d-4d86-959f-299371371e0a',
                    lang: 'ru_RU',
                    version: '2.1'
                },
                modals: {
                    modal1: true,                   
                }
            }
        },
        methods : {
            auth: function(){
                this.isAuth = true;
            }
        }
    };
</script>
