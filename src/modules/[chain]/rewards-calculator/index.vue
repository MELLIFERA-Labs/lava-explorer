<script setup lang="ts">
import {ref, computed, onMounted, watch, type ComputedRef} from 'vue';
import { useDebounceFn } from "@vueuse/core"
import {useFormatter, useStakingStore, useTxDialog} from "@/stores";
import {decimal2percent} from "@/widget-lib/utils/format";
import { useBlockchain } from '@/stores/useBlockchain';
import BigNumber from "bignumber.js";
import {useLavaSpecStore} from "@/stores/useLavaSpecStore";
import {useLavaProvidersStore} from "@/stores/useProvidersStore";

const specs = ref([] as any[]);
const format = useFormatter();
let specChainId = ref('');
let provider = ref(null);
let providerCU = ref('');
let amount = ref('');
let validator = ref('');
let inactiveValidators = ref([]);
let loadingRewards = ref(false);
let providers = ref([] as any[]);
const dialog = useTxDialog();
const lavaSpecStore = useLavaSpecStore()
const blockchain = useBlockchain();
const lavaProvidersStore = useLavaProvidersStore();
async function fetchProviders(chainID: string) {
  await lavaProvidersStore.reloadProviders(chainID);
  const providerRes = await lavaProvidersStore.getActiveProviders(chainID);
  const preferred = providerRes.find((p) => p?.moniker.trim().toLowerCase().includes('mellifera') || p?.description?.moniker.trim().toLowerCase().includes('mellifera'));
  if(preferred) {
    providers.value = [preferred, ...providerRes.filter((p) => p?.address !== preferred.address)];
  } else {
    providers.value = providerRes;
  }
}
function showResult() {
  return amount.value && validator.value;
}
const staking = useStakingStore();
const listValidator: ComputedRef<
    {
      operator_address: string;
      description: { moniker: string };
      commission: { commission_rates: { rate: string } };
      status: string;
    }[]
> = computed(() => {
  const preferred = staking.validators.find((v) => v.description.moniker.trim().toLowerCase().includes('mellifera'));
  if (preferred) {
    return [preferred, ...staking.validators.filter((v) => v.description.moniker.trim().toLowerCase() !== 'mellifera')];
  }
  return [...staking.validators, ...inactiveValidators.value];

});
function loadInactiveValidators() {
   staking.fetchInacitveValdiators().then((x: any) => {
     inactiveValidators.value = x;
   })
}
onMounted(() => {
  lavaSpecStore.getLavaSupportedChains({ enabled: false }).then((s) => {
    specs.value = s
  })
});

const onAmountInput = useDebounceFn(() => {
  calculateRewards();
}, 500)
const parseRewardsData = (data: any, rewardType: string) => {
  const rewards = [];
  data.info.forEach((item: any) => {
    item.amount.forEach((amt: any) => {
      const denom = amt.denom;
      rewards.push({
        type: item.source,
        amount: amt.amount,
        denom,
        rewardType, // 'Validator' or 'Provider'
        usdValue: 0, // We'll calculate this later
      });
    });
  });
  return rewards;
};
const rewards = ref([] as any[]);
const totalRewards = computed(() => {
  const totals: Record<string, BigNumber> = {};
  rewards.value.forEach((reward) => {
    if (!totals[reward.denom]) {
      totals[reward.denom] = BigNumber(0);
    }
    totals[reward.denom] = BigNumber(totals[reward.denom]).plus(BigNumber(reward.amount));
  });
  return totals;
});
async function calculateRewards() {
  if (!amount.value || !validator.value) {
    loadingRewards.value = false;
    return;
  }
  if(provider.value === null && specChainId.value) {
    return;
  }
  loadingRewards.value = true;
  const convertAmount = BigNumber(Number(amount.value)).times(BigNumber(10).pow(6)).toString() + 'ulava';
  const validatorRewardsData = await blockchain.rpc.getEstimateValidatorRewards(validator.value, convertAmount);
  const validatorRewards = parseRewardsData(validatorRewardsData, 'Validator');
  if(provider.value && specChainId.value) {
    const cuData = await lavaProvidersStore.providerCus(specChainId.value, provider.value);
    providerCU.value = cuData?.base_pay?.iprpc_cu ?? '0';
    const providerRewardsData = await blockchain.rpc.getEstimateProviderRewards(provider.value, specChainId.value, convertAmount).catch(() => null);
    if(providerRewardsData) {
      const providerRewards = parseRewardsData(providerRewardsData, 'Provider');
      rewards.value = [...validatorRewards, ...providerRewards];
    } else {
      rewards.value = validatorRewards;
    }

  } else {
    rewards.value = validatorRewards;
  }
  //pre load denoms
  rewards.value.forEach((reward) => {
    format.tokenDisplayDenom(reward.denom);
  });
  setTimeout(() => {
    loadingRewards.value = false;
  }, 500);
}

const totalUsd = computed(() => {
  return Object.entries(totalRewards.value).reduce((acc, [denom, amount]) => {
    if(denom.startsWith('ibc/')) {
      denom = format.tokenDisplayDenom(denom) || denom;
    }
    if(denom) {
      const usdValue = BigNumber(format.tokenValueNumber({amount: amount.toString(), denom}));
      return acc.plus(usdValue);
    }
    return acc;

  }, BigNumber(0)).toString();
})

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

function filterNaN(value: string) {
  return value === 'NaN' ? '' : value;
}
watch(specChainId, (current, prev) => {
  if (current) {
    fetchProviders(current);
  } else {
    providers.value = [];
  }
});
</script>
<template>

  <div>
    <div class="bg-base-100 rounded-sm p-4 mt-4 mb-4 shadow">
      <h2 class="text-xl font-bold">Rewards calculator</h2>
    </div>
    <div class="bg-base-100 rounded-sm p-4 mt-4 shadow">

      <div>
      <h3 class="text-lg font-bold">stake + restake = rewards</h3>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Amount</span>
          <span>
                  -
              </span>
        </label>
        <label class="join">
          <input
              v-model="amount"
              @input="onAmountInput"
              type="number"
              placeholder="Your amount"
              class="input border border-gray-300 dark:border-gray-600 w-full join-item dark:text-white"
          />
        </label>
      </div>
      <div class="form-control">
          <label class="label">
            <span class="label-text">Validator</span>
            <a class="label-text" @click="loadInactiveValidators()"
            >Show Inactive</a
            >
          </label>
          <select v-model="validator" class="select select-bordered dark:text-white" @change="calculateRewards()">
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
        <select v-model="specChainId" class="select select-bordered dark:text-white" @change="calculateRewards()">
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
          <span class="label-text">Select provider for restake</span>
        </label>
        <select v-model="provider" class="select select-bordered dark:text-white" @change="calculateRewards()">
          <option value="">--</option>
          <option v-for="p in providers" :value="p.address">
            {{ p.moniker || p.description?.moniker || p.address }} ({{ p.delegate_commission }}%)
          </option>
        </select>
      </div>
      </div>
    </div>
    <div v-if="showResult() && loadingRewards" class="bg-base-100 rounded-sm p-6 mt-4 shadow-lg text-center">
      <span  class="loading loading-spinner w-16 h-16"></span>
    </div>
    <div v-if="showResult() && !loadingRewards">
      <!-- Rewards Summary Section -->
      <div class="bg-base-100 rounded-sm p-6 mt-4 shadow-lg">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-center">Your Rewards</h2>
          <p class="text-center text-gray-600 dark:text-gray-300">
            A summary of all your <strong>estimated</strong> rewards for next <strong>month</strong> payout period.
          </p>
        </div>

        <!-- Total Rewards Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
              v-for="(amount, denom) in totalRewards"
              :key="denom"
              class="bg-white dark:bg-[#1f2937] rounded-lg shadow p-6"
          >
            <div class="text-center">
              <h3 class="text-xl font-medium text-gray-900 dark:text-white">
<!--                {{ // item.denom }}-->
               {{ format.tokenDisplayDenom(denom).toUpperCase() }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Rewards
              </p>
            </div>
            <div class="mt-4 text-center">
              <div class="text-3xl font-bold text-main">
                {{ format.formatToken( { amount: amount.toString(), denom}, false) }}
              </div>
              <div class="text-md text-green-600 dark:text-green-400" v-if="format.tokenValue({denom: format.tokenDisplayDenom(denom), amount: amount.toString() }) !== '0'">
                {{ filterNaN(format.tokenValue({denom: format.tokenDisplayDenom(denom), amount: amount.toString() })) }}$
              </div>
            </div>
          </div>
        </div>

        <!-- Grand Total USD -->
        <div class="mt-8 text-center">
          <div v-if="formatNumber(Number(totalUsd)) !== '0'">
            <h3 class="text-xl font-semibold">Total rewards USD</h3>
            <div class="text-3xl font-bold text-main mt-2">
              {{ formatNumber(Number(totalUsd)) }} $
            </div>
          </div>
          <h3 v-if="providerCU" class="text-xl mt-4 font-semibold">Selected provider performance CU</h3>
          <div class="text-3xl font-bold text-main mt-2">
            {{format.formatNumber(providerCU, '0,0')}}
          </div>
          <label for="lava_delegate" class="mt-6 btn !bg-primary text-white"
                 @click="dialog.open('lava_delegate', {
                   validator_address: validator,
                   provider_address: provider,
                   chain_id: specChainId
                 })">delegate & restake</label>
        </div>
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6 mb-6" role="alert">
          <p class="font-bold">Please Note:</p>
          <p>
            The rewards displayed are <strong>estimated</strong> for the next month's payout period. Final results may change based on factors such as provider and validator operational status, the number of relays produced by the provider, and other variables. <strong>This estimation do not take into account provider performance</strong>
          </p>
        </div>
      </div>

      <!-- Detailed Rewards Section -->
      <div class="bg-base-100 rounded-sm p-6 mt-4 shadow-lg">
        <h2 class="text-2xl font-bold mb-4">Detailed Rewards Breakdown</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
              v-for="reward in rewards"
              :key="reward.type + reward.currency + reward.amount"
              class="bg-white dark:bg-[#1f2937] rounded-lg shadow p-4"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ reward.type }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Source: {{ reward.rewardType }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-main">
                  {{ format.formatToken( { amount: reward.amount.toString(), denom: reward.denom}) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<route>
{
meta: {
i18n: 'rewards_calculator',
order: 2
}
}
</route>


