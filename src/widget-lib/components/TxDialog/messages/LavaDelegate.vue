<script lang="ts" setup>
import {computed, type ComputedRef, type PropType, ref, watch} from 'vue';
import {
  getActiveValidators,
  getInactiveValidators,
  getProvidersMetadata,
  getSpecs,
  getStakingParam
} from '../../../utils/http';
import type {Coin, CoinMetadata} from '../../../utils/type';
import {TokenUnitConverter} from '../../../utils/TokenUnitConverter';
import {decimal2percent} from "@/widget-lib/utils/format";
const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String,
});
const params = computed(() => JSON.parse(props.params || '{}'));

const validator = ref('');

const activeValidators = ref<any[]>([]);
const inactiveValidators = ref([]);

const provider = ref('');


const providers = ref([] as any[]);
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
        chainID: '*',
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
  return [...activeValidators.value, ...inactiveValidators.value].map((v: any) => (
    {
      ...v,
      label: `${v.description.moniker} (${decimal2percent(v.commission.commission_rates.rate)}%)`,
    }));
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
}

function initial() {
  providers.value = [];
  provider.value = params.value.provider_address;
  validator.value = params.value.validator_address;
  getActiveValidators(props.endpoint).then((x) => {
    const preferredValidator = x?.validators.find(matchMoniker);
    activeValidators.value = [preferredValidator, ...x?.validators.filter((v: { operator_address?: string }) => v?.operator_address !== preferredValidator?.operator_address) ?? []];
    if (!params.value.validator_address && params.value.validator_address !== null) {
      validator.value = x.validators.find(
          (v: any) => v.description.moniker.trim().toLowerCase().includes('mellifera')
      )?.operator_address;
    }
  });
  getProvidersMetadata(props.endpoint).then((x) => {
    const preferredProvider = x?.MetaData?.find(matchMoniker);
    const allProviders = [preferredProvider, ...x?.MetaData.filter((p: {provider?: string }) => p?.provider !== preferredProvider?.provider) ?? []];
    const providersWithLabel= allProviders.map((p:any) => ({
      ...p, 
      label: `${p.moniker || p.description?.moniker || p.provider} | ${p.chains.length} Services | ${p.delegate_commission}% Commision`
    })) || [];
    providers.value = providersWithLabel; 
    
    if(!params.value.provider_address) {
      provider.value = providersWithLabel.find(matchMoniker)?.provider;
    }
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
      <input :value="sender" type="text"
        class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Validator</span>
        <a class="label-text" @click="loadInactiveValidators()">Show Inactive</a>
      </label>
      <v-select v-model="validator" :options="listValidator" label="label" :reduce="(v:any) => v.operator_address" />
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
        <input v-model="amount" type="number" :placeholder="`Available: ${available?.display.amount}`"
          class="input border border-gray-300 dark:border-gray-600 w-full join-item dark:text-white" />
        <select v-model="amountDenom" class="select select-bordered join-item dark:text-white">
          <option v-for="u in units">{{ u.denom }}</option>
        </select>
      </label>
    </div>
    <!-- Display Validated Chains -->
    <div v-if="validatedChains.length > 0" class="mt-4">
      <h3 class="font-bold mb-2 label-text">Chains provided by Selected Provider:</h3>
      <div class="flex flex-wrap gap-2">
        <span v-for="chain in validatedChains" :key="chain"
          class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
          {{ chain }}
        </span>
      </div>
    </div>
  </div>

</template>
