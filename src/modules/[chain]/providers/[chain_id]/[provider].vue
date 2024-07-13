<script lang="ts" setup>

import {Icon} from "@iconify/vue";
import { onMounted, computed, ref } from 'vue';
import {useLavaProvidersStore} from "@/stores/useProvidersStore";
import {useFormatter, useStakingStore} from "@/stores";
import ProviderCommsionRate from "@/components/ProviderCommsionRate.vue";
import dayjs from "dayjs";
const props = defineProps(['provider', 'chain', 'chain_id']);
const provider: string = props.provider;
const lavaChainId: string = props.chain_id;
const identity = ref('');
const p = ref({} as any);
const cache = JSON.parse(localStorage.getItem('providers-avatars') || '{}');
const avatars = ref(cache || {});
let showCopyToast = ref(0);
const format = useFormatter();
const staking = useStakingStore()
const lavaProvidersStore = useLavaProvidersStore();
const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = 1;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  } catch (err) {
    showCopyToast.value = 2;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  }
};
const fetchAvatar = (identity: string) => {
  // fetch avatar from keybase
  return new Promise<void>((resolve) => {
    staking
        .keybase(identity)
        .then((d) => {
          if (Array.isArray(d.them) && d.them.length > 0) {
            const uri = String(d.them[0]?.pictures?.primary?.url).replace(
                'https://s3.amazonaws.com/keybase_processed_uploads/',
                ''
            );

            avatars.value[identity] = uri;
            resolve();
          } else throw new Error(`failed to fetch avatar for ${identity}.`);
        })
        .catch((error) => {
          // console.error(error); // uncomment this if you want the user to see if the avatar failed to load.
          resolve();
        });
  });
};
const tipMsg = computed(() => {
  return showCopyToast.value === 2
      ? { class: 'error', msg: 'Copy Error!' }
      : { class: 'success', msg: 'Copy Success!' };
});
const logo = (identity?: string) => {
  if (!identity) return '';
  const url = avatars.value[identity] || '';
  return url.startsWith('http')
      ? url
      : `https://s3.amazonaws.com/keybase_processed_uploads/${url}`;
};

const loadAvatar = (identity: string) => {
  // fetches avatar from keybase and stores it in localStorage
  fetchAvatar(identity).then(() => {
    localStorage.setItem('providers-avatars', JSON.stringify(avatars.value));
  });
};
onMounted(() => {
  if(provider && lavaChainId) {
    lavaProvidersStore.getProviderByAddress(provider, lavaChainId).then((res) => {
      p.value = res;
      identity.value = res.description?.identity || '';
      if (identity.value && !avatars.value[identity.value]) loadAvatar(identity.value);
    });
  }
})
</script>
<template>
  <div>
    <div class="bg-base-100 px-4 pt-3 pb-4 rounded shadow border-indigo-500">
      <div class="flex flex-col lg:!flex-row pt-2 pb-1">
        <div class="flex-1">
          <div class="flex">
            <div class="avatar mr-4 relative w-24 rounded-lg overflow-hidden">
              <div class="w-24 rounded-lg absolute opacity-10"></div>
              <div class="w-24 rounded-lg">
                <img
                    v-if="identity && avatars[identity] !== 'undefined'"
                    v-lazy="logo(identity)"
                    class="object-contain"
                    @error="
                    (e) => {
                      loadAvatar(identity);
                    }
                  "
                />
                <Icon
                    v-else
                    class="text-8xl"
                    :icon="`mdi-help-circle-outline`"
                />
              </div>
            </div>
            <div class="mx-2">
              <h4>{{ p.description?.moniker || '-' }}</h4>
              <div class="text-sm mb-4">
                {{ p.description?.identity || '-' }}
              </div>
              <label
                  for="delegate"
                  class="btn btn-primary btn-sm w-full"
                  @click=""
              >restake</label
              >
            </div>
          </div>
          <div class="m-4 text-sm">
            <p class="text-sm mb-3 font-medium">{{ $t('staking.about_us') }}</p>
            <div class="card-list">
              <div class="flex items-center mb-2">
                <Icon icon="mdi-web" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.website') }}: </span>
                <a
                    :href="p?.description?.website || '#'"
                    :class="
                    p?.description?.website
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  "
                >
                  {{  p?.description?.website || '-' }}
                </a>
              </div>
              <div class="flex items-center">
                <Icon icon="mdi-email-outline" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.contact') }}: </span>
                <a
                    v-if="p.description?.security_contact"
                    :href="'mailto:' + p.description?.security_contact || '#' "
                    class="cursor-pointer"
                >
                  {{ p.description?.security_contact || '-' }}
                </a>
              </div>
            </div>
            <p class="text-sm mt-4 mb-3 font-medium">{{ $t('staking.validator_status') }}</p>
            <div class="card-list">
              <div class="flex items-center">
                <Icon icon="mdi-shield-alert-outline" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.jailed') }}: </span>
                <span :class="p.jailed === true ? 'text-error' : ''"> {{p.jailed === true ? dayjs.unix(p.jail_end_time).fromNow() : '-' }} </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex flex-col mt-10">
            <div class="flex mb-2">
              <div
                  class="flex items-center justify-center rounded w-10 h-10"
                  style="border: 1px solid #666"
              >
                <Icon icon="mdi-coin" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4 v-if="p.total_stake">
                  {{
                    format.formatToken(
                        {
                          amount: parseInt(p.total_stake).toString(),
                          denom: staking.params.bond_denom,
                        },
                        true,
                        '0,0'
                    )
                  }}
                </h4>
                <span class="text-sm">Total stake</span>
              </div>
            </div>
            <div class="flex mb-2">
              <div
                  class="flex items-center justify-center rounded w-10 h-10"
                  style="border: 1px solid #666"
              >
                <Icon icon="mdi-percent" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4 v-if="p?.stake?.amount">
                  {{
                    format.formatToken(
                        {
                          amount: parseInt(p.stake.amount).toString(),
                          denom: staking.params.bond_denom,
                        },
                        true,
                        '0,0'
                    )
                  }}
                </h4>
                <span class="text-sm">Self stake</span>
              </div>
            </div>

            <div class="flex mb-2">
              <div
                  class="flex items-center justify-center rounded w-10 h-10"
                  style="border: 1px solid #666"
              >
                <Icon icon="mdi-account-tie" class="text-3xl" />
              </div>

              <div class="ml-3 flex flex-col">
                <h4 v-if="p?.delegate_limit?.amount" >
                  {{
                    format.formatToken(
                        {
                          amount: parseInt(
                              p.delegate_limit.amount
                          ).toString(),
                          denom: staking.params.bond_denom,
                        },
                        true,
                        '0,0'
                    )
                  }}
                </h4>
                <span class="text-sm">Delegate limit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-sm px-4 pt-3 border-t">{{ p.description?.details}}</div>
    </div>
    <div class="mt-3 grid grid-cols-1 md:!grid-cols-2 gap-4">
      <div>
        <ProviderCommsionRate :commission="Number(p.delegate_commission)"></ProviderCommsionRate>
      </div>
      <div class="bg-base-100 rounded shadow relative overflow-auto">
        <div class="px-4 pt-4 mb-2 text-main font-lg font-semibold">
          {{ $t('staking.addresses') }}
        </div>
        <div class="px-4 pb-4">
          <div class="mb-3">
            <div class="text-sm flex"> Provider Address
              <Icon
                  icon="mdi:content-copy"
                  class="ml-2 cursor-pointer"
                  v-show="true"
                  @click="copyWebsite(p.address || '')"
              />
            </div>
            <RouterLink
                class="text-xs text-primary"
                :to="`/${chain}/account/${p.address}`"
            >
              {{ p.address }}
            </RouterLink>
          </div>
          <div class="mb-3">
            <div class="text-sm flex"> Vault Address
              <Icon
                  icon="mdi:content-copy"
                  class="ml-2 cursor-pointer"
                  v-show="true"
                  @click="copyWebsite( p.vault || '')"
              /></div>
            <div class="text-xs">
              {{ p.vault }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- end -->
    <div class="toast" v-show="showCopyToast === 1">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === 2">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.staking-table.table :where(th, td) {
    padding: 8px 5px;
    background: transparent;
}
</style>
