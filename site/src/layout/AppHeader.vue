<template>
    <div>
    <header class="header-global">
        
        <base-nav class="navbar-main" transparent type="" effect="light" expand>
            <router-link slot="brand" class="navbar-brand mr-lg-5" to="/">
                <!--<img src="img/brand/white.png" alt="logo"> -->
            </router-link>
            <ul class="navbar-nav align-items-lg-center ml-lg-auto">
                
                <li class="nav-item d-none d-lg-block ml-lg-4">
                    <base-button target="_blank" rel="noopener" class="btn btn-2 btn-icon btn-primary" @click="modals.modal2 = true;">
                        <span class="btn-inner--icon"> <i class="fa fa-info mr-2"></i> Информация</span>
                    </base-button>
                </li>
                <li class="nav-item d-none d-lg-block ml-lg-4">
                    <a href="#" target="_blank" rel="noopener" class="btn btn-2 btn-icon btn-primary">
                        <span class="btn-inner--icon"> <i class="fa fa-google mr-2"></i> Google Play</span>
                    </a>
                </li>
                <li class="nav-item d-none d-lg-block ml-lg-4">
                    <a href="#" target="_blank" rel="noopener" class="btn btn-2 btn-icon btn-primary">
                        <span class="btn-inner--icon"> <i class="fa fa-apple mr-2"></i> App Store</span>
                    </a>
                </li>
            </ul>
        </base-nav>

        <div class="card bg-default shadow border-0" style="position: absolute; right: 0px; bottom: 0px; z-index: 999; width: 20%; height: 100%; opacity: 0.8">
            <blockquote class="card-blockquote" >
                <base-input alternative
                    v-model="searchUsername"
                    class="mb-3"
                    placeholder="Имя пользователя"
                    addon-left-icon="ni ni-circle-08">
                </base-input>
                
                <div>
                    <table class="table-sm table">
                        <tr v-for="user in users" v-bind:key="user.place" style="color: #FFF">
                            <th>{{user.place}}</th>
                            <td>{{user.name}}</td>
                            <td>{{user.wr}}</td>
                        </tr>
                    </table>
                </div>
            </blockquote>
        </div>
    </header>
    </div>
</template>
<script>
import BaseNav from "@/components/BaseNav";
import BaseDropdown from "@/components/BaseDropdown";
import CloseButton from "@/components/CloseButton";

export default {
  components: {
    BaseNav,
    CloseButton,
    BaseDropdown
  },
  data() {
    return {
      modals: {
        modal1: true
      },
      searchUsername: null,
      users : [
          { place: 1, name: 'Олег', wr: 89 },
          { place: 2, name: 'Игорь', wr: 82 },
          { place: 3, name: 'Сергей', wr: 80 },
          { place: 4, name: 'Олег', wr: 79 },
          { place: 5, name: 'Олег', wr: 77 },
          { place: 6, name: 'Олег', wr: 74 },
          { place: 7, name: 'Олег', wr: 71 },
          { place: 8, name: 'Олег', wr: 68 },
          { place: 9, name: 'Олег', wr: 66 },
          { place: 10, name: 'Олег', wr: 60 }
      ]
    };
  }
};
</script>