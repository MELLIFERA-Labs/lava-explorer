<script setup lang="ts">
import {ref, computed, onMounted, type ComputedRef} from 'vue';
import { useDebounceFn } from "@vueuse/core"
import {useFormatter, useStakingStore} from "@/stores";
import {decimal2percent} from "@/widget-lib/utils/format";
import { useBlockchain } from '@/stores/useBlockchain';
import BigNumber from "bignumber.js";
const format = useFormatter();
let amount = ref('');
let validator = ref('');
let inactiveValidators = ref([]);
let loadingRewards = ref(false);
const blockchain = useBlockchain();
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
  const preferredIndex = staking.validators.findIndex((v) => v.description.moniker.trim().toLowerCase().includes('mellifera'));
  if (preferredIndex > -1) {
    const preferred = staking.validators.splice(preferredIndex, 1)[0];
    return [preferred, ...staking.validators, ...inactiveValidators.value];
  }
  return [...staking.validators, ...inactiveValidators.value];

});
function loadInactiveValidators() {
   staking.fetchInacitveValdiators().then((x: any) => {
     inactiveValidators.value = x;
   })
}

const onAmountInput = useDebounceFn(() => {
  loadRewards();
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
    totals[reward.denom] = BigNumber(totals[reward.denom]).plus(reward.amount);
  });
  return totals;
});
async function loadRewards() {
  if (!amount.value || !validator.value) {
    loadingRewards.value = false;
    return;
  }
  loadingRewards.value = true;
  const convertAmount = BigNumber(Number(amount.value)).times(BigNumber(10).pow(6)).toString() + 'ulava';
  const validatorRewardsData = await blockchain.rpc.getEstimateValidatorRewards(validator.value, convertAmount);
  const validatorRewards = parseRewardsData(validatorRewardsData, 'Validator');
  // const rewards = ref([...validatorRewards, ...providerRewards]);
  rewards.value = validatorRewards;
  loadingRewards.value = false;
}
const exchangeRates: Record<string, number> = {
  'LAVA': 0.005, // Example: 1 LAVA = $0.005
  'ATOM': 7.5,   // Example: 1 ATOM = $7.50
};

const totalRewardsUSD = computed(() => {
  const totals: Record<string, string> = {};
  Object.keys(totalRewards.value).forEach((currency) => {
    const amount = totalRewards.value[currency];
    const usdValue = amount * (exchangeRates[currency] || 0);
    totals[currency] = usdValue.toFixed(2);
  });
  return totals;
});

const grandTotalUSD = computed(() => {
  let total = 0;
  Object.keys(totalRewardsUSD.value).forEach((currency) => {
    total += parseFloat(totalRewardsUSD.value[currency]);
  });
  return total.toFixed(2);
});
const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// Denomination to currency mapping




// Function to parse rewards data

// Parse rewards


// Combine all rewards
// const rewards = ref([...validatorRewards, ...providerRewards]);
//
// // Compute total rewards per currency
// const totalRewards = computed(() => {
//   const totals: Record<string, number> = {};
//   rewards.value.forEach((reward) => {
//     if (!totals[reward.currency]) {
//       totals[reward.currency] = 0;
//     }
//     totals[reward.currency] += reward.amount;
//   });
//   return totals;
// });

// Placeholder exchange rates (replace with actual rates)
</script>
<template>

  <div>
    <div class="bg-base-100 rounded-sm p-4 mt-4 shadow">
      <div>
      <h3 class="text-lg font-bold">If you stake & restake</h3>
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
        <select  class="select select-bordered dark:text-white">
          <option value="">--</option>
          <option>
            CHAIN
          </option>
        </select>
      </div>
      <div class="form-control" v-if="![1].length">
        <label class="label">
          <span class="label-text">Select provider</span>
        </label>
        <input
            :value="true ? 'No providers found for this chain' : 'Select a chain first'"
            type="text"
            disabled
            class="text-warning-600 dark!:text-red input border !border-gray-300 dark:!border-gray-600"
        />
      </div>
      <div class="form-control" v-if="true && [1].length">
        <label class="label">
          <span class="label-text">Select provider</span>
        </label>
        <select  class="select select-bordered dark:text-white">
          <option value="">--</option>
          <option>
             Provider
          </option>
        </select>
      </div>
<!--        <form class="space-y-6" action="#" method="POST">-->
<!--          <div class="modal-action flex justify-between items-center">-->
<!--            <button class="btn btn-primary" @click.prevent="">-->
<!--              <span  class="loading loading-spinner"></span>-->
<!--              CALCULATE-->
<!--            </button>-->
<!--          </div>-->
<!--        </form>-->
      </div>
    </div>
    <div v-if="showResult()">
      <!-- Rewards Summary Section -->
      <div class="bg-base-100 rounded-sm p-6 mt-8 shadow-lg">

        <div class="mb-6">
          <h2 class="text-2xl font-bold text-center">Your Total Rewards</h2>
          <p class="text-center text-gray-600 dark:text-gray-300">
            A summary of all your <strong>estimated</strong> rewards for next <strong>month</strong> payout period.
          </p>
        </div>

        <!-- Total Rewards Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
<!--                {{// amount}}-->
<!--                {{ // formatNumber(amount) }} {{ // currency }}-->
                {{ format.formatToken( { amount: amount.toString(), denom}) }}
              </div>
              <div class="text-md text-green-600 dark:text-green-400">
  <!--                ${{ // totalRewardsUSD[currency] }}-->
              </div>
            </div>
          </div>
        </div>

        <!-- Grand Total USD -->
        <div class="mt-8 text-center">
          <h3 class="text-xl font-semibold">Total USD Value</h3>
          <div class="text-4xl font-bold text-main mt-2">
            ${{ grandTotalUSD }}
          </div>
          <label for="lava_delegate" class="mt-6 btn !bg-primary text-white"
                 @click="">delegate & restake</label>
        </div>
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6 mb-6" role="alert">
          <p class="font-bold">Please Note:</p>
          <p>
            The rewards displayed are <strong>estimated</strong> for the next month's payout period. Final results may change based on factors such as provider and validator operational status, the number of relays produced by the provider, and other variables.
          </p>
        </div>
      </div>

      <!-- Detailed Rewards Section -->
      <div class="bg-base-100 rounded-sm p-6 mt-8 shadow-lg">
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
                  {{ formatNumber(reward.amount) }} {{ reward.currency }}
                </div>
                <!-- Optional: Display USD value if needed -->
                <!--
                <div class="text-md text-green-600 dark:text-green-400">
                  ${{ (reward.amount * (exchangeRates[reward.currency] || 0)).toFixed(2) }}
                </div>
                -->
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


