<script lang="ts" setup>
import { type PropType, computed, ref } from 'vue';
import type { Coin, CoinMetadata } from '../../../utils/type';
import { getStakingParam } from '../../../utils/http';
import { TokenUnitConverter } from '../../../utils/TokenUnitConverter';

const props = defineProps({
  endpoint: { type: String, required: true },
  sender: { type: String, required: true },
  balances: Object as PropType<Coin[]>,
  metadata: Object as PropType<Record<string, CoinMetadata>>,
  params: String, // optional, can preload title/description/typeUrl
});

const parsedParams = computed(() => JSON.parse(props.params || '{}'));

// Refs for user input
const denom = ref('');
const amount = ref('');
const amountDenom = ref('');
const title = ref('');
const description = ref('');
const typeUrl = ref(parsedParams.value.content?.typeUrl || '/cosmos.gov.v1beta1.TextProposal');

const available = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  const base = props.balances?.find(x => x.denom === denom.value) || {
    amount: '0',
    denom: denom.value,
  };
  return {
    base,
    display: convert.baseToUnit(base, amountDenom.value),
  };
});

const msgs = computed(() => {
  const convert = new TokenUnitConverter(props.metadata);
  return [
    {
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: {
        content: {
          typeUrl: '/cosmos.gov.v1beta1.TextProposal',
          value: {
            title: title.value,
            description: description.value,
          },
        },
        proposer: props.sender,
        initial_deposit: [
          convert.displayToBase(denom.value, {
            amount: String(amount.value),
            denom: amountDenom.value,
          }),
        ],
      },
    },
  ];
});

const units = computed(() => {
  if (!props.metadata || !props.metadata[denom.value]) {
    amountDenom.value = denom.value;
    return [{ denom: denom.value, exponent: 0, aliases: [] }];
  }
  const list = props.metadata[denom.value].denom_units.sort((a, b) => b.exponent - a.exponent);
  if (list.length > 0) amountDenom.value = list[0].denom;
  return list;
});

const isValid = computed(() => {
  let ok = true;
  let error = '';
  if (!title.value.trim() || !description.value.trim()) {
    ok = false;
    error = 'Title and description are required';
  }
  if (!(Number(amount.value) > 0)) {
    ok = false;
    error = 'Amount must be greater than 0';
  }
  return { ok, error };
});

function initial() {
  getStakingParam(props.endpoint).then(x => {
    denom.value = x.params.bond_denom;
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
        readonly
        class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600"
      />
    </div>

    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">Proposal Title</span>
      </label>
      <input
        v-model="title"
        type="text"
        placeholder="Enter proposal title"
        class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white"
      />
    </div>

    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">Proposal Description</span>
      </label>
      <textarea
        v-model="description"
        placeholder="Enter proposal description"
        class="textarea border border-gray-300 dark:border-gray-600 w-full dark:text-white"
      />
    </div>

    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">Deposit Amount</span>
        <span class="text-xs text-gray-500">
          Available: {{ available?.display.amount }}{{ available?.display.denom }}
        </span>
      </label>
      <label class="input-group">
        <input
          v-model="amount"
          type="number"
          :placeholder="`Available: ${available?.display.amount}`"
          class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white"
        />
        <select v-model="amountDenom" class="select select-bordered dark:text-white">
          <option v-for="u in units" :key="u.denom">{{ u.denom }}</option>
        </select>
      </label>
    </div>

    <div v-if="!isValid.ok" class="text-sm text-red-500 mt-2">
      ⚠ {{ isValid.error }}
    </div>
  </div>
</template>
