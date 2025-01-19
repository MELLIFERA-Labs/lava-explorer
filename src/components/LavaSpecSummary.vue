<script lang="ts" setup>
import { useDashboard } from '@/stores/useDashboard';
import { Icon } from '@iconify/vue';

const props = defineProps({
  spec: {
    type: Object,
    required: true,
  },
});

const dashboardStore = useDashboard();
const addFavor = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
  dashboardStore.favoriteProviderSpecMap[props.spec.chainID] =
      !dashboardStore?.favoriteProviderSpecMap?.[props.spec.chainID];
  window.localStorage.setItem(
      'favoriteProviderSpecMap',
      JSON.stringify(dashboardStore.favoriteProviderSpecMap)
  );
};
</script>
<template>
  <RouterLink
      :to="`chains/${spec.chainID}`"
      class="bg-base-10 0 hover:bg-gray-100 dark:hover:bg-[#373f59] rounded shadow flex items-center px-3 py-3 cursor-pointer"
  >
    <div class="w-8 h-8  rounded-full overflow-hidden">
      <img :src="spec?.meta?.logo" />
    </div>
    <div class="font-semibold ml-4 text-base flex-1 truncate capitalize">
      {{ spec?.meta?.prettyName || spec.chainName  }}
    </div>
    <div
        @click="addFavor"
        class="pl-4 text-xl"
        :class="{
        'text-warning': dashboardStore?.favoriteProviderSpecMap?.[props.spec.chainID],
        'text-gray-300 dark:text-gray-500':
          !dashboardStore?.favoriteProviderSpecMap?.[props.spec.chainID],
      }"
    >
      <Icon icon="mdi-star" />
    </div>
  </RouterLink>
</template>