<script setup lang="ts">
import {computed, type ComputedRef, onMounted, ref, watch} from 'vue';
import {useDebounceFn} from "@vueuse/core"
import {useFormatter, useStakingStore, useTxDialog} from "@/stores";
import {decimal2percent} from "@/widget-lib/utils/format";
import {useBlockchain} from '@/stores/useBlockchain';
import BigNumber from "bignumber.js";
import {useLavaSpecStore} from "@/stores/useLavaSpecStore";
import {useLavaProvidersStore} from "@/stores/useProvidersStore";

const specs = ref([] as any[]);
const format = useFormatter();
let provider = ref(null);
let providerCU = ref('0');
let amount = ref('');
let amountUsd = ref('');
let validator = ref('');
let investedUsd = ref(0);
let inactiveValidators = ref([]);
let isAPY = ref(true);
let loadingRewards = ref(false);
let providers = ref([] as any[]);
let totalProviderCUs = ref(0);
const dialog = useTxDialog();
const lavaSpecStore = useLavaSpecStore()
const blockchain = useBlockchain();
const lavaProvidersStore = useLavaProvidersStore();
const mode = computed(() => isAPY.value ? 'apy' : 'apr');
async function fetchProviders() {
  const providerRes = await lavaProvidersStore.getProvidersMetadata();
  const preferred = providerRes.find((p) => p?.description?.moniker.trim().toLowerCase().includes('mellifera'));
  let prv = providerRes;
  if(preferred) {
    prv = [preferred, ...providerRes.filter((p) => p?.provider !== preferred.provider)];
  } else {
    prv = providerRes;
  }
  providers.value = prv.map((p) => ({
    ...p,
    label: `${p.moniker || p.description?.moniker || p.provider} | ${p.chains.length} Services | ${p.delegate_commission}% Commision`,
  }));
  // Promise.all(providerRes.map(async (p) => {
  //   loadPerformance.value = true;
  //   const cuData = await lavaProvidersStore.providerCus(chainID, p.address);
  //   return cuData?.base_pay?.iprpc_cu ?? '0';
  // })).then((x) => {
  //   totalProviderCUs.value = x.reduce((acc, val) => acc + Number(val), 0);
  //   loadPerformance.value = false;
  // })
}
function showResult() {
  return amount.value && validator.value;
}

let providerPerformancePercent = computed(() => {
  return (Number(providerCU.value) / totalProviderCUs.value) * 100;
});
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
  let validators = staking.validators;
  if (preferred) {
    validators = [preferred, ...staking.validators.filter((v) => v.description.moniker.trim().toLowerCase() !== 'mellifera')];
  }
  return validators.map(v => (
    {
      ...v,
      label: `${v.description.moniker} (${decimal2percent(v.commission.commission_rates.rate)}%)`,
    }));
});
function loadInactiveValidators() {
   staking.fetchInacitveValdiators().then((x: any) => {
     inactiveValidators.value = x;
   })
}
onMounted(async () => {
  lavaSpecStore.getLavaSupportedChains({ enabled: false }).then((s) => {
    specs.value = s
  })
  await fetchProviders();
});

const onAmountInput = useDebounceFn(() => {
  calculateRewards();
}, 500)

const  convertUSDtoLava = useDebounceFn(() => {
  if (!amountUsd.value) {
    amount.value = '';
    return;
  }
  const lavaPrice = format.price('ulava');
  amount.value = BigNumber(amountUsd.value).div(lavaPrice).toFixed(2).toString();
  calculateRewards();
}, 500);

const convertLavaToUSD = useDebounceFn(() => {
  if (!amount.value) {
    amountUsd.value = '';
    return;
  }
  const unitAmount  = BigNumber(Number(amount.value)).times(BigNumber(10).pow(6)).toString()
  const amountUsdValue = format.tokenValueNumber({ denom: 'ulava', amount: unitAmount }).toFixed(2);
  amountUsd.value = amountUsdValue.toString();
  calculateRewards();
}, 500);
const parseRewardsData = (data: any, rewardType: string) => {
  const rewards = [] as any[];
  if(data.info.length) {
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
  } else {
    data.total.forEach((amt: any) => {
      const denom = amt.denom;
      rewards.push({
        type: 'Total',
        amount: amt.amount,
        denom,
        rewardType, // 'Validator' or 'Provider'
        usdValue: 0, // We'll calculate this later
      });
    });
  }
  
  return rewards;
};
const rewards = ref([] as any[]);
const totalRewards = computed(() => {
  const totals: Record<string, {
    amountUSD: number,
    amount: BigNumber,
    apr: { income: BigNumber, amount: BigNumber, percent: number },
    apy: { income: BigNumber, amount: BigNumber, percent: number },
    itemPrice: number,
    displayDenom: string
  }> = {};

  rewards.value.forEach((reward) => {
    if (!totals[reward.denom]) {
      totals[reward.denom] = {
        amountUSD: 0,
        amount: BigNumber(0),
        apr: { income: BigNumber(0), amount: BigNumber(0), percent: 0 },
        apy: { income: BigNumber(0), amount: BigNumber(0), percent: 0 },
        displayDenom: reward.displayDenom,
        itemPrice: reward.itemPrice,
      };
    }

    const totalAmount = BigNumber(totals[reward.denom].amount).plus(BigNumber(reward.amount));
    const totalAmountUSD = totals[reward.denom].amountUSD + Number(reward.usdValue);

    totals[reward.denom] = {
      amount: totalAmount,
      amountUSD: totalAmountUSD,
      apr: { income: BigNumber(0), amount: BigNumber(0), percent: 0 },
      apy: { income: BigNumber(0), amount: BigNumber(0), percent: 0 },
      itemPrice: reward.itemPrice,
      displayDenom: reward.displayDenom,
    };
  });

  // Calculate APR and APY
  Object.entries(totals).forEach(([denom, total]) => {
    const rate = BigNumber(total.amountUSD).div(investedUsd.value)
    // APR calculation
    const aprPercent = rate.times(12).times(100).toNumber();
    // investedUsd.value * (aprPercent / 100);
    const incomeAPR = BigNumber(investedUsd.value).times(BigNumber(aprPercent).div(100));
    const amountAPR = total.amount.times(12);

    // APY calculation
    // (Math.pow(1 + rate, 12) - 1) * 100
    const apyPercent = BigNumber(BigNumber(rate).plus(1)).pow(12).minus(1).times(100).toNumber();
    const incomeAPY = BigNumber(investedUsd.value).times(apyPercent / 100);
    const denomMetadata = format.getDenomMetadata(denom);
    // incomeAPY / total.itemPrice
    const amountAPY = BigNumber(BigNumber(incomeAPY).div(total.itemPrice)).times(BigNumber(10).pow(denomMetadata?.maxExponent || 6));

    totals[denom] = {
      ...total,
      apr: {
        income: incomeAPR,
        amount: amountAPR,
        percent: aprPercent,
      },
      apy: {
        income: incomeAPY,
        amount: amountAPY,
        percent: apyPercent,
      },
    };
  });
  return totals;
});

async function calculateRewards() {
  
  if (!amount.value || !validator.value) {
    console.log('missed1')
    loadingRewards.value = false;
    return;
  }
  if(!provider.value) {
    console.log('missed2')
    providerCU.value = '';
  }
  
  console.log('calculateRewards');
  loadingRewards.value = true;
  const unitAmount  = BigNumber(Number(amount.value)).times(BigNumber(10).pow(6)).toString()
  const convertAmount = unitAmount + 'ulava';
  const validatorRewardsData = await blockchain.rpc.getEstimateValidatorRewards(validator.value, convertAmount);
  const validatorRewards = parseRewardsData(validatorRewardsData, 'Validator');
  if(provider.value) {
    // const cuData = await lavaProvidersStore.providerCus(specChainId.value, provider.value);
    // providerCU.value = cuData?.base_pay?.iprpc_cu ?? '0';
    const providerRewardsData = await blockchain.rpc.getEstimateProviderRewards(provider.value, convertAmount).catch(() => null);
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
    format.price(format.tokenDisplayDenom(reward.denom) ?? '')
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  const rewardsUsd = rewards.value.map((reward) => {
    return {
      ...reward,
      amountAnnual: BigNumber(reward.amount).times(12).toString(),
      displayDenom: format.tokenDisplayDenom(reward.denom),
      itemPrice: format.price(format.tokenDisplayDenom(reward.denom) ?? ''),
      usdValue: format.tokenValueNumber({ denom: format.tokenDisplayDenom(reward.denom) ?? '', amount: reward.amount }),
    };
  });
  const investedLavaUsd = format.tokenValueNumber({ denom: 'ulava', amount: unitAmount });

  rewards.value = rewardsUsd;
  investedUsd.value = investedLavaUsd;
  loadingRewards.value = false;
}

const totalUsd = computed(() => {
  return Object.entries(totalRewards.value).reduce((acc, [denom, amount]) => {
    return acc.plus(amount[mode.value].income);
  }, BigNumber(0)).toString();
})
const totalPercent = computed(() => {
  return Object.entries(totalRewards.value).reduce((acc, [denom, amount]) => {
    return acc.plus(amount[mode.value].percent);
  }, BigNumber(0)).toString();
})

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

function filterNaN(value: string) {
  return value === 'NaN' ? '' : value;
}
const validatedChains = computed(() => {
  const selectedProvider = providers.value.find((p) => p.provider === provider.value);
  return selectedProvider ? selectedProvider.chains : [];
});
watch(provider, () => {
  calculateRewards();
});
watch(validator, () => {
  calculateRewards();
});
</script>
<template>
  <div class="container mx-auto p-6">
    <!-- Rewards Calculator Header -->
    <div class="bg-base-100 rounded-lg p-4 mt-4 mb-4 shadow text-center">
      <h2 class="text-2xl font-bold">Rewards Calculator</h2>
    </div>

    <!-- Input Section -->
    <div class="bg-base-100 rounded-lg p-4 mt-4 shadow">
      <h3 class="text-lg font-bold mb-4">Stake + Restake = Rewards</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- LAVA Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">LAVA</span>
          </label>
          <input v-model="amount" @input="convertLavaToUSD" type="number" placeholder="Enter amount in LAVA"
            class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white" />
        </div>

        <!-- USD Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">USD</span>
          </label>
          <input v-model="amountUsd" @input="convertUSDtoLava" type="number" placeholder="Enter amount in USD"
            class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white" />
        </div>
      </div>

      <!-- Validator Selection -->
      <div class="form-control mt-4">
        <label class="label">
            <span class="label-text">Select a Validator</span>
        </label>
        <v-select
          v-model="validator"
          :options="listValidator"
          label="label"
          :reduce="(v:any) => v.operator_address"
        />
      </div>
      <div class="form-control mt-4">
        <label class="label">
          <span class="label-text">Select provider for restake</span>
        </label>
        <v-select
          v-model="provider"
          :options="providers"
          label="label"
          :reduce="(p:any) => p.provider"
        />
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

      <!-- Compounding Option -->
      <div class="flex items-center mt-4">
        <input v-model="isAPY" type="checkbox" class="checkbox checkbox-primary mr-2" />
        <label class="cursor-pointer dark:text-gray-400">Compounded</label>
      </div>

    </div>


    <!-- Loading Spinner -->
    <div v-if="showResult() && loadingRewards" class="bg-base-100 rounded-lg p-6 mt-4 shadow-lg text-center">
      <span class="loading loading-spinner w-16 h-16"></span>
    </div>

    <!-- Rewards Summary Section -->
    <div v-if="showResult() && !loadingRewards">
      <div class="bg-base-100 rounded-lg p-6 mt-4 shadow-lg">
        <h2 class="text-2xl font-bold text-center mb-4">Your Estimated Rewards Summary</h2>
        <div class="text-center mt-4">
          <div class="text-3xl font-bold text-main mt-2 mb-2">
            {{ formatNumber(Number(totalPercent)) }} % <span class="text-md">APR</span>
          </div>
        </div>

        <!-- Total Rewards Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div v-for="(item, denom) in totalRewards" :key="denom"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="text-center">
              <div class="text-xl font-bold text-main">
                {{ formatNumber(item[mode].percent) }} % APR
              </div>
              <div class="text-3xl font-bold">
                {{ format.formatToken({ amount: item[mode].amount.toString(), denom }) }}
              </div>
              <div class="text-md text-green-600 dark:text-green-400">
                {{ formatNumber(item[mode].income.toNumber()) }} $
              </div>
            </div>
          </div>
        </div>

        <!-- Grand Total USD -->
        <div class="text-center mt-8">
          <div v-if="formatNumber(Number(totalUsd)) !== '0'">
            <h3 class="text-xl font-semibold">Total Rewards USD</h3>
            <div class="text-3xl font-bold text-main mt-2">
              {{ formatNumber(Number(totalUsd)) }} $
            </div>
          </div>

          <!-- <h3 v-if="providerCU" class="text-xl mt-4 font-semibold">Selected provider performance CU</h3>
          <div class="text-3xl font-bold text-main mt-2">
            {{ format.formatNumber(Number(providerCU), '0,0') }}
          </div> -->

          <!-- <div class="text-md" v-if="providerPerformancePercent">
            {{ format.formatNumber(Number(providerPerformancePercent), '0.[00]') }} %
          </div> -->

          <!-- Delegate & Restake Button -->
          <label for="lava_delegate" class="mt-6 btn !bg-primary text-white" @click="dialog.open('lava_delegate', {
                   validator_address: validator,
                   provider_address: provider,
                 })">delegate & restake</label>
        </div>

        <!-- Note Section -->
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6">
          <p class="font-bold">Please Note:</p>
          <p>
            The rewards displayed are <strong>estimated</strong> annual rewards. Final results may change based on
            factors such as provider and validator operational status, the number of relays produced by the provider,
            and other variables. <strong>This estimation do not take into account provider performance</strong>
          </p>
        </div>
      </div>
      <div class="bg-base-100 rounded-sm p-6 mt-4 shadow-lg">
        <h2 class="text-2xl font-bold mb-4">Detailed Rewards Breakdown</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Without compounding
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div v-for="reward in rewards" :key="reward.type + reward.currency + reward.amount"
            class="bg-white dark:bg-[#1f2937] rounded-lg shadow p-4">
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
                  {{ format.formatToken({ amount: reward.amountAnnual.toString(), denom: reward.denom }) }}
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