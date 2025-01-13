<script lang="ts" setup>


import {computed, onMounted, ref} from "vue";
import {useLavaSpecStore} from "@/stores/useLavaSpecStore";
import LavaChainSummary from "@/components/LavaSpecSummary.vue";
import {Icon} from "@iconify/vue";
import {useDashboard} from "@/stores";

const lavaSpecStore = useLavaSpecStore()
const dashboardStore = useDashboard();
let supportedChains = ref([] as any)

const keywords = ref('');
const specs = computed(() => {
  if (keywords.value) {
    const lowercaseKeywords = keywords.value.toLowerCase();

    return supportedChains.value.filter(
        (x: any) => x.chainName.toLowerCase().indexOf(lowercaseKeywords) > -1
    );
  }
  return supportedChains.value;
});


const favoriteSpecs = computed(() => {
  return supportedChains.value.filter((x: any) => dashboardStore.favoriteProviderSpecMap[x.chainID])
})
onMounted(() => {
  lavaSpecStore.getLavaSupportedChains({enabled: false}).then((specs) => {
    supportedChains.value = specs
  })
})

</script>
<template>
  <div>
    <div class="px-4 pt-4 pb-2 text-lg font-semibold text-main">
      Select Spec to view providers
    </div>
    <div v-if="favoriteSpecs.length" class="text-center text-base mt-6 text-primary">
      <h2 class="mb-6"> Favorite specs 🔥 </h2>
    </div>

    <div v-if="favoriteSpecs.length"
         class="grid grid-cols-1 gap-4 mt-6 md:!grid-cols-3 lg:!grid-cols-4 2xl:!grid-cols-5"
    >
      <LavaChainSummary
          v-for="spec in favoriteSpecs"
          :key="spec.chainID"
          :spec="spec"
      />
    </div>
    <div class="flex items-center rounded-lg bg-base-100  border border-gray-200 dark:border-gray-700 mt-10">
      <Icon icon="mdi:magnify" class="text-2xl text-gray-400 ml-3"/>
      <input placeholder="Search spec"  class="px-4 h-10 bg-transparent flex-1 outline-none text-base" v-model="keywords" />
      <div class="px-4 text-base hidden md:!block">{{ specs.length }}/{{ supportedChains.length }}</div>
    </div>
    <LavaChainSummary
        v-for="spec in specs"
        :key="spec.chainID"
        :spec="spec"
    ></LavaChainSummary>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'chains',
      order: 2
    }
  }
</route>

<style>
.staking-table.table :where(th, td) {
    padding: 8px 5px;
    background: transparent;
}
</style>

