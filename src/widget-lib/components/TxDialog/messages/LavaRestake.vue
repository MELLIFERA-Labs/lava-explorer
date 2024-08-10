<script lang="ts" setup>
import {type ComputedRef, type PropType, computed, onMounted, ref, watch} from 'vue';
import {
  getActiveValidators,
  getInactiveValidators,
  getStakingParam,
  getSpecs, getProviders, getDelegatorProviders
} from '../../../utils/http';
import { decimal2percent } from '../../../utils/format';
import type { Coin, CoinMetadata } from '../../../utils/type';
import { TokenUnitConverter } from '../../../utils/TokenUnitConverter';

const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String,
});
const params = computed(() => JSON.parse(props.params || '{}'));

const provider = ref('');
const specChainId = ref('');

const providers = ref([]);
const specs = ref([]);
const inactiveValidators = ref([]);
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
      (x) => x.provider === 'empty_provider'
  );
  console.log({userProviders})
  console.log({emptyProvider})
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
function fetchProviders(chainID: string) {
   getProviders(props.endpoint, chainID).then((x) => {
    providers.value = x.stakeEntry;
  });
}
watch(specChainId, (x) => {
  provider.value = '';
  if (x) {
    fetchProviders(x);
  } else {
    providers.value = [];
  }
});
function initial() {
  providers.value = [];
  provider.value = params.value.validator_address;

  getStakingParam(props.endpoint).then((x) => {
    stakingDenom.value = x.params.bond_denom;
    unbondingTime.value = x.params.unbonding_time;
  });
  getSpecs(props.endpoint).then((x) => {
    specs.value = x.chainInfoList;
  });
  getDelegatorProviders(props.endpoint, props.sender).then((x) => {
    console.log({x})
    userProviders.value = x.delegations;
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

<!--    <div class="form-control">-->
<!--      <label class="label">-->
<!--        <span class="label-text">Validator</span>-->
<!--        <a class="label-text" @click="loadInactiveValidators()"-->
<!--        >Show Inactive</a-->
<!--        >-->
<!--      </label>-->
<!--      <select v-model="provider" class="select select-bordered dark:text-white">-->
<!--        <option value="">Select a validator</option>-->
<!--        <option v-for="v in list" :value="v.operator_address">-->
<!--          {{ v.description.moniker }} ({{-->
<!--            decimal2percent(v.commission.commission_rates.rate)-->
<!--          }}%)-->
<!--          <span v-if="v.status !== 'BOND_STATUS_BONDED'">x</span>-->
<!--        </option>-->
<!--      </select>-->
<!--    </div>-->
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
