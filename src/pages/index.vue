<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import {
  useDashboard,
  LoadingStatus,
  type ChainConfig,
} from '@/stores/useDashboard';
import ChainSummary from '@/components/ChainSummary.vue';
import AdBanner from '@/components/ad/AdBanner.vue';

import { computed, onMounted, ref } from 'vue';
import { useBlockchain } from '@/stores';

const dashboard = useDashboard();

const keywords = ref('');
const chains = computed(() => {
  if (keywords.value) {
    const lowercaseKeywords = keywords.value.toLowerCase();

    return Object.values(dashboard.chains).filter(
      (x: ChainConfig) => x.chainName.toLowerCase().indexOf(lowercaseKeywords) > -1 
      || x.prettyName.toLowerCase().indexOf(lowercaseKeywords) > -1
    );
  } else {
    return Object.values(dashboard.chains);
  }
});

const featured = computed(() => {
  const names = ["cosmos", "osmosis", "akash", "celestia", "evmos", "injective", "dydx", "noble"];
  return chains.value
    .filter(x => names.includes(x.chainName))
    .sort((a, b)=> (names.indexOf(a.chainName) - names.indexOf(b.chainName)))
})

const chainStore = useBlockchain()

</script>
<template>
  <div class="">
    <div class="flex md:!flex-row flex-col items-center justify-center mb-6 mt-14 gap-2">
      <div class="w-16 rounded-full">
        <svg class="w-full h-auto" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify" viewBox="0 0 375 374.999991" preserveAspectRatio="xMidYMid meet" version="1.2"><defs><clipPath id="51197a8c0a"><path d="M 9.140625 9.140625 L 365.859375 9.140625 L 365.859375 365.859375 L 9.140625 365.859375 Z M 9.140625 9.140625 "/></clipPath><clipPath id="d3f61bc621"><path d="M 313.574219 61.363281 L 313.636719 61.425781 C 347.074219 94.863281 365.859375 140.214844 365.859375 187.5 C 365.859375 234.785156 347.074219 280.136719 313.636719 313.574219 L 313.574219 313.636719 C 280.136719 347.074219 234.785156 365.859375 187.5 365.859375 C 140.214844 365.859375 94.863281 347.074219 61.425781 313.636719 L 61.363281 313.574219 C 27.925781 280.136719 9.140625 234.785156 9.140625 187.5 C 9.140625 140.214844 27.925781 94.863281 61.363281 61.425781 L 61.425781 61.363281 C 94.863281 27.925781 140.214844 9.140625 187.5 9.140625 C 234.785156 9.140625 280.136719 27.925781 313.574219 61.363281 Z M 313.574219 61.363281 "/></clipPath><clipPath id="c44c0071bd"><path d="M 130.023438 130.023438 L 244.976562 130.023438 L 244.976562 244.976562 L 130.023438 244.976562 Z M 130.023438 130.023438 "/></clipPath><clipPath id="7aa20bc672"><path d="M 187.5 130.023438 C 155.757812 130.023438 130.023438 155.757812 130.023438 187.5 C 130.023438 219.242188 155.757812 244.976562 187.5 244.976562 C 219.242188 244.976562 244.976562 219.242188 244.976562 187.5 C 244.976562 155.757812 219.242188 130.023438 187.5 130.023438 Z M 187.5 130.023438 "/></clipPath></defs><g id="9fc440c70f"><g clip-rule="nonzero" clip-path="url(#51197a8c0a)"><g clip-rule="nonzero" clip-path="url(#d3f61bc621)"><path style=" stroke:none;fill-rule:nonzero;fill:#ffffff;fill-opacity:0;" d="M 9.140625 9.140625 L 365.859375 9.140625 L 365.859375 365.859375 L 9.140625 365.859375 Z M 9.140625 9.140625 "/><path style="fill:none;stroke-width:15.768828;stroke-linecap:butt;stroke-linejoin:miter;stroke:#ff3900;stroke-opacity:1;stroke-miterlimit:4;" d="M 128.014464 21.959245 L 128.040745 21.985526 C 142.101283 36.046064 150.00048 55.11649 150.00048 74.999996 C 150.00048 94.883502 142.101283 113.953928 128.040745 128.014466 L 128.014464 128.040747 C 113.953926 142.101285 94.8835 150.000482 74.999994 150.000482 C 55.116488 150.000482 36.046062 142.101285 21.985525 128.040747 L 21.959243 128.014466 C 7.898705 113.953928 -0.00049176 94.883502 -0.00049176 74.999996 C -0.00049176 55.11649 7.898705 36.046064 21.959243 21.985526 L 21.985525 21.959245 C 36.046062 7.898707 55.116488 -0.000489868 74.999994 -0.000489868 C 94.8835 -0.000489868 113.953926 7.898707 128.014464 21.959245 Z M 128.014464 21.959245 " transform="matrix(2.37811,0,0,2.37811,9.141794,9.14179)"/></g></g><g clip-rule="nonzero" clip-path="url(#c44c0071bd)"><g clip-rule="nonzero" clip-path="url(#7aa20bc672)"><path style=" stroke:none;fill-rule:nonzero;fill:#ff3900;fill-opacity:1;" d="M 130.023438 130.023438 L 244.976562 130.023438 L 244.976562 244.976562 L 130.023438 244.976562 Z M 130.023438 130.023438 "/></g></g></g></svg>
      </div>
      <h1 class="text-primary text-3xl md:!text-6xl font-bold">
        {{ $t('pages.title') }}
      </h1>
    </div>
    <div class="text-center text-base">
      <p class="mb-1">
        {{ $t('pages.slogan') }}
      </p>
    </div>
    <div
      v-if="dashboard.status !== LoadingStatus.Loaded"
      class="flex justify-center"
    >
      <progress class="progress progress-info w-80 h-1"></progress>
    </div>

    <div v-if="featured.length>0" class="text-center text-base mt-6 text-primary">
      <h2 class="mb-6"> Featured Blockchains 🔥 </h2>
    </div>

    <div v-if="featured.length>0"
      class="grid grid-cols-1 gap-4 mt-6 md:!grid-cols-3 lg:!grid-cols-4 2xl:!grid-cols-5"
    >
    <ChainSummary
        v-for="(chain, index) in featured"
        :key="index"
        :name="chain.chainName"
      />
    </div>

    <!-- <AdBanner id="home-banner-ad" unit="banner" width="970px" height="90px" /> -->

    <div class="text-center text-base mt-6 text-primary">
      <h2 class="mb-6">{{ $t('pages.description') }}</h2>
    </div>

    <div class="flex items-center rounded-lg bg-base-100  border border-gray-200 dark:border-gray-700 mt-10">
      <Icon icon="mdi:magnify" class="text-2xl text-gray-400 ml-3"/>
      <input :placeholder="$t('pages.search_placeholder')" class="px-4 h-10 bg-transparent flex-1 outline-none text-base" v-model="keywords" />
      <div class="px-4 text-base hidden md:!block">{{ chains.length }}/{{ dashboard.length }}</div>
    </div>

    <div
      class="grid grid-cols-1 gap-4 mt-6 md:!grid-cols-3 lg:!grid-cols-4 2xl:!grid-cols-5"
    >
      <ChainSummary
        v-for="(chain, index) in chains"
        :key="index"
        :name="chain.chainName"
      />
    </div>
  </div>
</template>

<style scoped>
 .logo path{
  fill: #0F172A;
}
</style>@/components/ad/ad
