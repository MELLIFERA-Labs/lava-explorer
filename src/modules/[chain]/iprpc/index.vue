<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useFormatter } from '@/stores';
import { useCountdown } from '@/composables/useCountdown';
import { useLavaSpecStore } from '@/stores/useLavaSpecStore';

const format = useFormatter();
const specStore = useLavaSpecStore();

let innitialSeconds = ref(0);

let { days, hours, minutes, seconds } = useCountdown({
  initialSeconds: innitialSeconds,
});

interface IPRPCPool {
  spec: string;
  chainName: string | null;
  fund: Array<{
    denom: string;
    amount: string;
  }>;
}

const iprpcRewards = ref<IPRPCPool[]>([]);
const isLoading = ref(true);

onMounted(async () => {
    specStore.getLavaIPRPCRewardsPools().then(rewardsPools => iprpcRewards.value = rewardsPools);
    const pools = await specStore.getLavaPools();
    innitialSeconds.value = pools.time_to_refill;
    isLoading.value = false;
});

const iprpcPools = computed(() => {
  if (!iprpcRewards.value?.length) return [];
  
  return iprpcRewards.value.map(pool => ({
    spec: pool.spec,
    chainName: pool.chainName || pool.spec,
    amount: format.formatToken(
      {
        amount: pool.fund[0].amount,
        denom: pool.fund[0].denom,
      },
      true,
      '0,0'
    )
  }));
});
</script>

<template>
  <div class="bg-base-100 px-4 pt-3 pb-3 rounded shadow">
    <div class="flex flex-col items-center text-center lg:items-start lg:text-left gap-4 mb-4">
      <div class="text-lg font-semibold">IPRPC Pools - Current Month</div>
      <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <span class="text-sm font-medium whitespace-nowrap">Next payout in:</span>
        <div v-if="isLoading" class="flex flex-wrap justify-center gap-1 sm:gap-2">
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded animate-pulse">
            <div class="w-6 sm:w-8 h-4 bg-base-300 rounded"></div>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded animate-pulse">
            <div class="w-6 sm:w-8 h-4 bg-base-300 rounded"></div>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded animate-pulse">
            <div class="w-6 sm:w-8 h-4 bg-base-300 rounded"></div>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded animate-pulse">
            <div class="w-6 sm:w-8 h-4 bg-base-300 rounded"></div>
          </div>
        </div>
        <div v-else class="flex flex-wrap justify-center gap-1 sm:gap-2">
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded">
            <span class="font-mono text-sm sm:text-base">{{ days }}</span>
            <span class="text-xs ml-1">days</span>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded">
            <span class="font-mono text-sm sm:text-base">{{ hours }}</span>
            <span class="text-xs ml-1">hrs</span>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded">
            <span class="font-mono text-sm sm:text-base">{{ minutes }}</span>
            <span class="text-xs ml-1">min</span>
          </div>
          <div class="bg-base-200 px-2 sm:px-3 py-1 rounded">
            <span class="font-mono text-sm sm:text-base">{{ seconds }}</span>
            <span class="text-xs ml-1">sec</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-transparent mb-4 mt-4"></div>
  
  <div class="bg-base-100 px-4 pt-3 pb-4 rounded shadow">
    <!-- Table with responsive columns -->
    <div class="overflow-x-auto">
      <table class="table staking-table w-full min-w-full">
        <thead class="bg-base-200">
          <tr>
            <th class="uppercase text-left">Chain Name</th>
            <th class="uppercase text-left">Amount</th>
            <th class="uppercase text-left">Spec</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pool in iprpcPools" :key="pool.spec" class="hover:bg-base-50">
            <td class="py-3">
              <RouterLink 
                class="text-primary hover:underline transition-colors duration-200 font-medium capitalize" 
                :to="`/${$route.params.chain}/chains/${pool.spec}/`"
              >
                {{ pool.chainName }}
              </RouterLink>
            </td>
            <td class="py-3">
              <span class="font-mono">{{ pool.amount }}</span>
            </td>
            <td class="py-3">
              <span class="font-medium">{{ pool.spec }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
.staking-table.table :where(th, td) {
    padding: 8px 5px;
    background: transparent;
}
</style>

<route>
    {
      meta: {
        i18n: 'iprpc',
        order: 2 
      }
    }
</route>
