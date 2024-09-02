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
const provider = ref('');

const specs = ref([]);
const stakingDenom = ref('');
const unbondingTime = ref('');
const amount = ref('');
const amountDenom = ref('');
const userProviders = ref([]);
const msgs = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  return [
    {
      typeUrl: '/lavanet.lava.dualstaking.MsgRedelegate',
      value: {
        creator: props.sender,
        fromProvider: params.value.from_provider,
        toProvider: 'empty_provider',
        fromChainID: params.value.from_chain_id,
        toChainID: '*',
        amount: convert.displayToBase(stakingDenom.value, {
          amount: String(amount.value),
          denom: amountDenom.value,
        }),
      },
    },
  ];
});

const sourceProvider = ref('');
const sourceChain = computed(() => {
  // @ts-ignore
  const s = specs.value.find(s => s.chainID === params.value.from_chain_id)
  if(s) {
    // @ts-ignore
    return ` ${ s.chainName } - ${ s.chainID }`
  }
  return params.value.chain_id
})


const available = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  const emptyProvider = userProviders.value?.find(
      (x: any) => x.provider === params.value.from_provider
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
  if(!params.value.from_chain_id) {
    ok = false;
    error = 'Chain ID is empty';
  }
  if (!params.value.from_provider) {
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
  getDelegatorProviders(props.endpoint, props.sender).then((x) => {
    userProviders.value = x.delegations;
  });
  getProviders(props.endpoint, params.value.from_chain_id).then((x) => {
    const p = x.stakeEntry.find((p: any) => p.address === params.value.from_provider)
    sourceProvider.value = p ? `${ p.moniker || p.description?.moniker || p.address} (${p.delegate_commission}%)` : params.value.from_provider
  });
  getStakingParam(props.endpoint).then((x) => {
    stakingDenom.value = x.params.bond_denom;
    unbondingTime.value = x.params.unbonding_time;
  });
  getSpecs(props.endpoint).then((x) => {
    specs.value = x.chainInfoList;
  });
}
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
    <div class="form-control">
      <label class="label">
        <span class="label-text">Source Chain</span>
      </label>
      <input :value="sourceChain" type="text" class="input border border-gray-300 dark:border-gray-600 dark:text-white" readonly/>
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
