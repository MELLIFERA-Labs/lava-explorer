<script lang="ts" setup>
import {computed, type PropType, ref } from 'vue';
import {getDelegatorProviders, getProviders, getStakingParam, getProvidersMetadata} from '../../../utils/http';
import type {Coin, CoinMetadata} from '../../../utils/type';
import {TokenUnitConverter} from '../../../utils/TokenUnitConverter';
const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String,
});
const params = computed(() => JSON.parse(props.params || '{}'));
const provider = ref('');

const providers = ref([] as  any[]);
const stakingDenom = ref('');
const unbondingTime = ref('');
const amount = ref('');
const amountDenom = ref('');
const userProviders = ref([]);

const sourceProvider = ref('');


const msgs = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  return [
    {
      typeUrl: '/lavanet.lava.dualstaking.MsgRedelegate',
      value: {
        creator: props.sender,
        fromProvider: params.value.from_provider,
        toProvider: provider.value,
        fromChainID: '*',
        toChainID: '*',
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
  const currentProvider = userProviders.value?.find(
      (x: any) => x.provider === params.value.from_provider && x.chainID=== params.value.from_chain_id
  ) as any | undefined;
  const base = currentProvider?.amount || { amount: '0', denom: stakingDenom.value }
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

function initial() {
  providers.value = [];
  provider.value = params.value.provider_address;
  getDelegatorProviders(props.endpoint, props.sender).then((x) => {
    userProviders.value = x.delegations;
  });
  getProviders(props.endpoint, params.value.from_chain_id).then((x) => {
    const p = x.stakeEntry.find((p: any) => p.address === params.value.from_provider)
    sourceProvider.value = p ? `${ p.moniker || p.description?.moniker || p.address} (${p.delegate_commission}%)` : params.value.from_provider
  });
  getProvidersMetadata(props.endpoint).then((x) => {
    providers.value = x?.MetaData?.map((p:any) => ({
      ...p, 
      label: `${p.moniker || p.description?.moniker || p.provider} | ${p.chains.length} Services | ${p.delegate_commission}% Commision`
    })) || [];
    
  });
  
  getStakingParam(props.endpoint).then((x) => {
    stakingDenom.value = x.params.bond_denom;
    unbondingTime.value = x.params.unbonding_time;
  });
  
}
const validatedChains = computed(() => {
  const selectedProvider = providers.value.find((p) => p.provider === provider.value);
  return selectedProvider ? selectedProvider.chains : [];
});

defineExpose({ msgs, isValid, initial });
</script>
<template>
  <div>
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
        <span class="label-text">Source Provider</span>
      </label>
      <input :value="sourceProvider" type="text" class="input border border-gray-300 dark:border-gray-600 dark:text-white" readonly/>
    </div>
  
    <div class="form-control" v-if="providers.length">
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
