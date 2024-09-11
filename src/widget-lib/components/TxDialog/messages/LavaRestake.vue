<script lang="ts" setup>
import {computed, type ComputedRef, type PropType, ref, watch} from 'vue';
import {getDelegatorProviders, getProviders, getSpecs, getStakingParam} from '../../../utils/http';
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
const specChainId = ref('');

const providers = ref([] as any[]);
const specs = ref([] as any[]);
const inactiveValidators = ref([]);
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
        toChainID: specChainId.value,
        amount: convert.displayToBase(stakingDenom.value, {
          amount: String(amount.value),
          denom: amountDenom.value,
        }),
      },
    },
  ];
});

const list: ComputedRef<
    {
      operator_address: string;
      description: { moniker: string };
      commission: { commission_rates: { rate: string } };
      status: string;
    }[]
> = computed(() => {
  return [...providers.value, ...inactiveValidators.value];
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
  if(!specChainId.value) {
    ok = false;
    error = 'Chain ID is empty';
  }
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
function fetchProviders(chainID: string) {
   getProviders(props.endpoint, chainID).then((x) => {
    providers.value = x.stakeEntry;
    if(!params.value.provider_address) {
      provider.value = x.stakeEntry.find(matchMoniker)?.address || '';
    }
  });
}
watch(specChainId, (current,prev) => {
  if(!params.value.chain_id) {
    provider.value = '';
  } else if (current !== params.value.chain_id) {
    provider.value = '';
  }
  if (current) {
    fetchProviders(current);
  } else {
    providers.value = [];
  }
});
function initial() {
  providers.value = [];
  provider.value = params.value.provider_address;
  specChainId.value = params.value.chain_id;
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
  if(specChainId.value){
    fetchProviders(specChainId.value);
  }
  getStakingParam(props.endpoint).then((x) => {
    stakingDenom.value = x.params.bond_denom;
    unbondingTime.value = x.params.unbonding_time;
  });
  getSpecs(props.endpoint).then((x) => {
    specs.value = x.chainInfoList;
  });
}
function reloadPage() {

  window.location.href = router.resolve({name: 'chain-staking'}).href;
}
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
        <span class="label-text">Select chain</span>
      </label>
      <select v-model="specChainId" class="select select-bordered dark:text-white">
        <option value="">--</option>
        <option v-for="s in specs" :value="s.chainID">
          {{ s.chainName }} - {{ s.chainID }}
        </option>
      </select>
    </div>
    <div class="form-control" v-if="!providers.length">
      <label class="label">
        <span class="label-text">Select provider</span>
      </label>
      <input
          :value="specChainId ? 'No providers found for this chain' : 'Select a chain first'"
          type="text"
          disabled
          class="text-warning-600 dark!:text-red input border !border-gray-300 dark:!border-gray-600"
      />
    </div>
    <div class="form-control" v-if="specChainId && providers.length">
      <label class="label">
        <span class="label-text">Select provider</span>
      </label>
      <select v-model="provider" class="select select-bordered dark:text-white">
        <option value="">--</option>
        <option v-for="p in providers" :value="p.address">
          {{ p.moniker || p.description?.moniker || p.address }} ({{ p.delegate_commission }}%)
        </option>
      </select>
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
  </div>
</template>
