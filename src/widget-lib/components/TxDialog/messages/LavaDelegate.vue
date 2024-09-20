<script lang="ts" setup>
import {computed, type ComputedRef, type PropType, ref, watch} from 'vue';
import {
  getActiveValidators,
  getInactiveValidators,
  getProviders,
  getSpecs,
  getStakingParam
} from '../../../utils/http';
import type {Coin, CoinMetadata} from '../../../utils/type';
import {TokenUnitConverter} from '../../../utils/TokenUnitConverter';
import {useRouter} from 'vue-router';
import {decimal2percent} from "@/widget-lib/utils/format";
const router = useRouter();
const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String,
});
const params = computed(() => JSON.parse(props.params || '{}'));

const validator = ref('');

const activeValidators = ref([]);
const inactiveValidators = ref([]);

const provider = ref('');
const specChainId = ref('');

const providers = ref([] as any[]);
const specs = ref([] as any[]);
const stakingDenom = ref('');
const unbondingTime = ref('');
const amount = ref('');
const amountDenom = ref('');
const msgs = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  return [
    {
      typeUrl: '/lavanet.lava.dualstaking.MsgDelegate',
      value: {
        creator: props.sender,
        validator: validator.value,
        provider: provider.value,
        chainID: specChainId.value,
        amount: convert.displayToBase(stakingDenom.value, {
          amount: String(amount.value),
          denom: amountDenom.value,
        }),
      },
    },
  ];
});
const listValidator: ComputedRef<
    {
      operator_address: string;
      description: { moniker: string };
      commission: { commission_rates: { rate: string } };
      status: string;
    }[]
> = computed(() => {
  return [...activeValidators.value, ...inactiveValidators.value];
});
function loadInactiveValidators() {
  getInactiveValidators(props.endpoint).then((x) => {
    inactiveValidators.value = x.validators;
  });
}

const available = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  const base = props.balances?.find(
      (x) => x.denom === stakingDenom.value
  ) || { amount: '0', denom: stakingDenom.value };
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
  if (!validator.value) {
    ok = false;
    error = 'Validator is empty';
  }
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
      provider.value = x.stakeEntry.find(matchMoniker)?.address;
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
  validator.value = params.value.validator_address;
  getActiveValidators(props.endpoint).then((x) => {
    activeValidators.value = x.validators;
    if (!params.value.validator_address) {
      validator.value = x.validators.find(
          (v: any) => v.description.moniker.trim().toLowerCase().includes('mellifera')
      )?.operator_address;
    }
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
        <span class="label-text">Validator</span>
        <a class="label-text" @click="loadInactiveValidators()"
        >Show Inactive</a
        >
      </label>
      <select v-model="validator" class="select select-bordered dark:text-white">
        <option value="">Select a validator</option>
        <option v-for="v in listValidator" :value="v.operator_address">
          {{ v.description.moniker }} ({{
            decimal2percent(v.commission.commission_rates.rate)
          }}%)
          <span v-if="v.status !== 'BOND_STATUS_BONDED'">x</span>
        </option>
      </select>
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
