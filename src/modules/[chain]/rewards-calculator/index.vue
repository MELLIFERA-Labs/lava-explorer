
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
              type="number"
              placeholder="Your amount"
              class="input border border-gray-300 dark:border-gray-600 w-full join-item dark:text-white"
          />
        </label>
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Validator</span>
        </label>
        <select  class="select select-bordered dark:text-white">
          <option value="">Select a validator</option>
          <option  value="v.operator_address">
             test
<!--            <span v-if="v.status !== 'BOND_STATUS_BONDED'">x</span>-->
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
    <div>
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
              v-for="(amount, currency) in totalRewards"
              :key="currency"
              class="bg-white dark:bg-[#1f2937] rounded-lg shadow p-6"
          >
            <div class="text-center">
              <h3 class="text-xl font-medium text-gray-900 dark:text-white">
                {{ currency }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total Rewards
              </p>
            </div>
            <div class="mt-4 text-center">
              <div class="text-3xl font-bold text-main">
                {{ formatNumber(amount) }} {{ currency }}
              </div>
              <div class="text-md text-green-600 dark:text-green-400">
                ${{ totalRewardsUSD[currency] }}
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
<script setup lang="ts">
import { ref, computed } from 'vue';

// Denomination to currency mapping
const denomMap: Record<string, string> = {
  'ulava': 'LAVA',
  'ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B': 'ATOM',
};

// Sample data (replace with actual data parsing)
const validatorRewardsData = {
  "info": [
    {
      "source": "iprpc_COSMOSHUB",
      "amount": [
        {
          "denom": "ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B",
          "amount": "2076.963530339260831345"
        }
      ]
    },
    {
      "source": "iprpc_COSMOSHUBT",
      "amount": [
        {
          "denom": "ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B",
          "amount": "518.574320325073535358"
        }
      ]
    },
    {
      "source": "subscriptions",
      "amount": [
        {
          "denom": "ulava",
          "amount": "13330.959895760936239371"
        }
      ]
    },
    {
      "source": "blocks",
      "amount": [
        {
          "denom": "ulava",
          "amount": "18138106.364315048465081899"
        }
      ]
    }
  ],
  "total": [
    {
      "denom": "ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B",
      "amount": "2595.537850664334366703"
    },
    {
      "denom": "ulava",
      "amount": "18151437.324210809401321270"
    }
  ]
}
const providerRewardsData = {
  "info": [
    {
      "source": "iprpc",
      "amount": [
        {
          "denom": "ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B",
          "amount": "3911090.567200057098000000"
        }
      ]
    },
    {
      "source": "subscriptions",
      "amount": [
        {
          "denom": "ulava",
          "amount": "5650294.910330429691720102"
        }
      ]
    },
    {
      "source": "boost",
      "amount": [
        {
          "denom": "ulava",
          "amount": "30377929.610451429769720815"
        }
      ]
    }
  ],
  "total": [
    {
      "denom": "ibc/C09A0FFBA11313A32D42A58D820190E71E9D0D5AB3E841C0391EB9A623E07F4B",
      "amount": "3911090.567200057098000000"
    },
    {
      "denom": "ulava",
      "amount": "36028224.520781859461440917"
    }
  ]
}

// Function to parse rewards data
const parseRewardsData = (data: any, rewardType: string) => {
  const rewards = [];
  data.info.forEach((item: any) => {
    item.amount.forEach((amt: any) => {
      const currency = denomMap[amt.denom] || amt.denom;
      rewards.push({
        type: item.source,
        amount: parseFloat(amt.amount),
        currency,
        rewardType, // 'Validator' or 'Provider'
        usdValue: 0, // We'll calculate this later
      });
    });
  });
  return rewards;
};

// Parse rewards
const validatorRewards = parseRewardsData(validatorRewardsData, 'Validator');
const providerRewards = parseRewardsData(providerRewardsData, 'Provider');

// Combine all rewards
const rewards = ref([...validatorRewards, ...providerRewards]);

// Compute total rewards per currency
const totalRewards = computed(() => {
  const totals: Record<string, number> = {};
  rewards.value.forEach((reward) => {
    if (!totals[reward.currency]) {
      totals[reward.currency] = 0;
    }
    totals[reward.currency] += reward.amount;
  });
  return totals;
});

// Placeholder exchange rates (replace with actual rates)
const exchangeRates: Record<string, number> = {
  'LAVA': 0.005, // Example: 1 LAVA = $0.005
  'ATOM': 7.5,   // Example: 1 ATOM = $7.50
};

// Compute total USD value per currency
const totalRewardsUSD = computed(() => {
  const totals: Record<string, string> = {};
  Object.keys(totalRewards.value).forEach((currency) => {
    const amount = totalRewards.value[currency];
    const usdValue = amount * (exchangeRates[currency] || 0);
    totals[currency] = usdValue.toFixed(2);
  });
  return totals;
});

// Compute grand total USD value
const grandTotalUSD = computed(() => {
  let total = 0;
  Object.keys(totalRewardsUSD.value).forEach((currency) => {
    total += parseFloat(totalRewardsUSD.value[currency]);
  });
  return total.toFixed(2);
});

// Function to format numbers with commas
const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
</script>

