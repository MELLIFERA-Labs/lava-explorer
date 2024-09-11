<template>
  <div class="bg-base-100 rounded-sm p-4 mt-4 shadow">
    <div class="flex justify-between items-center">
      <div>
        <span class="text-sm font-semibold">{{ label }}</span>
        <span class="text-sm ml-2" v-if="currentEpoch">(Epoch: {{ currentEpoch }})</span>
      </div>
      <span class="text-xl">
          <span v-if="!estimateTime" class="loading loading-spinner"></span>
        <Countdown
            v-else
            :time="estimateTime"
            @progress="handleProgress"
            v-slot="{ minutes, seconds }"
        >
         {{`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}}
        </Countdown>
      </span>
    </div>
    <div class="relative pt-1">
      <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
        <div
            :style="{ width: `${progress}%` }"
            class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
        ></div>
      </div>
    </div>
<!--    passed block on block intervat -->
    <div class="flex justify-between text-xs">
      <div>
        <span class="font-semibold">Blocks in epoch:</span>
        <span class="ml-2">{{ props.epochIntervalBlock }}</span>
      </div>
      <div>
        <span class="font-semibold">{{ $t('block.remaining_blocks') }}:</span>
        <span class="ml-2">{{ remainingBlocks }}</span>
      </div>
      <div>
        <span class="font-semibold">{{ $t('block.average_block_time') }}:</span>
        <span class="ml-2">{{ store.calculateBlockTime ? (store.calculateBlockTime / 1000).toFixed(1) : '0' }}s</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue';
import Countdown from '@chenfengyuan/vue-countdown';
import {useBaseStore, useBlockchain} from "@/stores";
import {computed} from "@vue/reactivity";

const store = useBaseStore();
const props = defineProps({
  label: { type: String, required: true },
  epochIntervalBlock: { type: String, required: true, default: 60 },
  currentEpoch: { type: Number, required: false },
});
const startEpoch = ref('0');
const nextEpochBlock = computed(() => {
  return (Number(startEpoch.value) + Number(props.epochIntervalBlock))
});
const remainingBlocks = computed(() => {
  const latest = store.latest?.block?.header.height;
  return latest ? Number(nextEpochBlock.value) - Number(latest) : 0;
});

const estimateTime = computed(() => {
  if (!store.calculateBlockTime) {
    return null;
  }
  return remainingBlocks.value * Number((store.calculateBlockTime / 1000).toFixed()) * 1000;
});

const blockchain = useBlockchain();
const progress = ref(0);
function fetchStartEpoch() {
  blockchain.rpc.getEpochDetails()
      .then((res) => {
        startEpoch.value = res.EpochDetails.startBlock
   })
}
onMounted(() => {
  fetchStartEpoch();
});
const handleProgress = () => {
  const currentBlock = store.latest?.block?.header.height;
  if (currentBlock) {
    const blocksPassed = nextEpochBlock.value - Number(currentBlock);
    progress.value = Math.round(100 - ((blocksPassed * 100) / parseInt(props.epochIntervalBlock))) + 2;
  }
};
watch(
    () => remainingBlocks.value,
    (newValue) => {
      if (newValue <= 0) {
        fetchStartEpoch();
      }
    }
);
const unwatch = watch(
    () => store.latest?.block?.header.height,
    (newValue) => {
      if (newValue !== undefined && newValue !== null) {
        handleProgress();
        unwatch(); // Unwatch after the first call
      }
    }
);
</script>
