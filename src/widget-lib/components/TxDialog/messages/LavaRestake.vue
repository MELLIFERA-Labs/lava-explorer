<script lang="ts" setup>
import {computed, type PropType, ref, } from 'vue';
import {getDelegatorProviders, getProvidersMetadata, getStakingParam} from '../../../utils/http';
import type {Coin, CoinMetadata} from '../../../utils/type';
import {TokenUnitConverter} from '../../../utils/TokenUnitConverter';
import {useRouter} from 'vue-router';
const router = useRouter();
const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String,
});
const params = computed(() => JSON.parse(props.params || '{}'));
const setIsLavaWarning = ref(false);
const provider = ref('');

const providers = ref([] as any[]);
const stakingDenom = ref('');
const unbondingTime = ref('');
const amount = ref('');
const amountDenom = ref('');
const userProviders = ref([]);
const isLavaWarning = computed(() => setIsLavaWarning.value);
const msgs = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  return [
    {
      typeUrl: '/lavanet.lava.dualstaking.MsgRedelegate',
      value: {
        creator: props.sender,
        fromProvider: 'empty_provider',
        toProvider: provider.value,
        fromChainID: "*",
        toChainID: "*",
        amount: convert.displayToBase(stakingDenom.value, {
          amount: String(amount.value),
          denom: amountDenom.value,
        }),
      },
    },
  ];
});


const available = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  // Handle case where userProviders is not yet populated
  const emptyProvider = userProviders.value?.find(
      (x: any) => x.provider === 'empty_provider'
  ) as any | undefined;
  const base = emptyProvider?.amount || { amount: '0', denom: stakingDenom.value }
  return {
    base,
    display: convert.baseToUnit(base, amountDenom.value),
  };
});


const units = computed(() => {
  if (!props.metadata || !props.metadata[stakingDenom.value]) {
    amountDenom.value = stakingDenom.value;
    return [{ denom: stakingDenom.value, exponent: 0, aliases: [] }];
  }
  const list = props.metadata[stakingDenom.value].denom_units.sort(
      (a, b) => b.exponent - a.exponent
  );
  if (list.length > 0) amountDenom.value = list[0].denom;
  return list;
});

const isValid = computed(() => {
  let ok = true;
  let error = '';
  if (!provider.value) {
    ok = false;
    error = 'Provider is empty';
  }
  if (!(Number(amount.value) > 0)) {
    ok = false;
    error = 'Amount should be great than 0';
  }
  if (!amountDenom.value) {
    ok = false;
    error = 'Amount Denom is empty';
  }
  return { ok, error };
});
function matchMoniker(p: any) {
  return p?.description?.moniker?.trim()?.toLowerCase()?.includes('mellifera')
      || p?.moniker?.trim()?.toLowerCase()?.includes('mellifera');
}

function initial() {
  providers.value = [];
  provider.value = params.value.provider_address;
  getDelegatorProviders(props.endpoint, props.sender).then((x) => {
    const emptyProvider = x.delegations.find(
        (x: any) => x.provider === 'empty_provider'
    );
    if(!emptyProvider) {
      setIsLavaWarning.value = true;
    } else {
      setIsLavaWarning.value = false;
    }
    userProviders.value = x.delegations;
  });
  getStakingParam(props.endpoint).then((x) => {
    stakingDenom.value = x.params.bond_denom;
    unbondingTime.value = x.params.unbonding_time;
  });
  getProvidersMetadata(props.endpoint).then((x) => {
    const providersWithLabel= x?.MetaData?.map((p:any) => ({
      ...p, 
      label: `${p.moniker || p.description?.moniker || p.provider} | ${p.chains.length} Services | ${p.delegate_commission}% Commision`
    })) || [];
    providers.value = providersWithLabel;
    if(!params.value.provider_address) {
      provider.value = providersWithLabel.find(matchMoniker)?.provider;
    }
  });
  
}
function reloadPage() {

  window.location.href = router.resolve({name: 'chain-staking'}).href;
}
const validatedChains = computed(() => {
  const selectedProvider = providers.value.find((p) => p.provider === provider.value);
  return selectedProvider ? selectedProvider.chains : [];
});
defineExpose({ msgs, isValid, initial, noSend: isLavaWarning });
</script>
<template>
  <div v-if="isLavaWarning">
    <div class="mt-5 p-4 border-l-4 border-yellow-400 bg-yellow-50 text-yellow-700 rounded shadow-lg">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" aria-label="Warning" class="h-6 w-6 mr-3 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 20.4c-.883 0-1.6-.717-1.6-1.6s.717-1.6 1.6-1.6 1.6.717 1.6 1.6-.717 1.6-1.6 1.6zm1.6-5.6h-3.2V6.4h3.2V14.8z"/>
        </svg>
        <span class="flex-grow" >
        To proceed with restaking, please delegate to one or more
            <a class="underline font-semibold text-blue-600 hover:text-blue-800 cursor-pointer" @click="reloadPage" >validators</a>
      </span>
      </div>
      <blockquote class="mt-2 pl-4 border-l-2 border-gray-300 text-sm text-gray-600">
        By delegating, you help secure the network and earn rewards from validator. Once delegated, you can restake this balance to provider(s), improving network performance and earning rewards from provider(s).
      </blockquote>
    </div>
  </div>
  <div v-else>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Sender</span>
      </label>
      <input
          :value="sender"
          type="text"
          class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600"
      />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Select provider</span>
      </label>
      <v-select v-model="provider" :options="providers" label="label" :reduce="(p:any) => p.provider" />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Amount</span>
        <span>
                    {{ available?.display.amount }} {{ available?.display.denom }}
                </span>
      </label>
      <label class="join">
        <input
            v-model="amount"
            type="number"
            :placeholder="`Available: ${available?.display.amount}`"
            class="input border border-gray-300 dark:border-gray-600 w-full join-item dark:text-white"
        />
        <select v-model="amountDenom" class="select select-bordered join-item dark:text-white">
          <option v-for="u in units">{{ u.denom }}</option>
        </select>
      </label>
    </div>
    <!-- Display Validated Chains -->
    <div v-if="validatedChains.length > 0" class="mt-4">
      <h3 class="font-bold mb-2 label-text">Chains provided by Selected Provider:</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="chain in validatedChains"
          :key="chain"
          class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 shadow-sm"
        >
          {{ chain }}
        </span>
      </div>
    </div>
  </div>
</template>
