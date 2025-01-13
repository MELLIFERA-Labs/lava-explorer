<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useLavaProvidersStore } from '@/stores/useProvidersStore';
import { Icon } from '@iconify/vue';
import { computed } from '@vue/reactivity';
import Popper from 'vue3-popper';
import {useFormatter, useStakingStore, useTxDialog} from '@/stores';
import {useLavaSpecStore} from "@/stores/useLavaSpecStore";
const lavaProvidersStore = useLavaProvidersStore();
const lavaSpecStore = useLavaSpecStore()
let spec = ref({} as any);

const format = useFormatter();
const staking = useStakingStore();
const dialog = useTxDialog();
const cache = JSON.parse(localStorage.getItem('providers-avatars') || '{}');
const providers = ref([] as any);
const avatars = ref(cache || {});
const providersCUs = ref({} as any);
const loadAvatar = (identity: string) => {
  // fetches avatar from keybase and stores it in localStorage
  fetchAvatar(identity).then(() => {
    localStorage.setItem('providers-avatars', JSON.stringify(avatars.value));
  });
};

const loadAvatars = () => {
  // fetches all avatars from keybase and stores it in localStorage
  const promises = providers.value.map((provider: any) => {
    const identity = provider.description?.identity;

    // Here we also check whether we haven't already fetched the avatar
    if (identity && !avatars.value[identity]) {
      return fetchAvatar(identity);
    } else {
      return Promise.resolve();
    }
  });

  Promise.all(promises).then(() =>
    localStorage.setItem('providers-avatars', JSON.stringify(avatars.value))
  );
};

onMounted(async () => {
  console.log('loading providers');
  lavaProvidersStore.getProvidersMetadata().then((p) => {
    providers.value = p;
    return p;
  }).then((ps) => {
    console.log(ps);
    // ps.forEach((p: any) => {
    //   providersCUs.value[p.address] = {
    //     loading: true,
    //     cuInfo: 0,
    //   };
    //   lavaProvidersStore.providerCus(chainId, p.address)
    //     .then((d) => {
    //       providersCUs.value[p.address] = {
    //         loading: false,
    //         cuInfo: d,
    //       };
    //     })
    //     .catch(() => {
    //       providersCUs.value[p.address] = {
    //         loading: false,
    //         cuInfo: 0,
    //       };
    //     });
    // });
  });
});
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
        } else throw new Error(`failed to fetch avatar for ${identity}`);
      })
      .catch((error) => {
        // console.error(error); // uncomment this if you want the user to see which avatars failed to load.
        resolve();
      });
  });
};
const logo = (identity?: string) => {
  if (!identity || !avatars.value[identity]) return '';
  const url = avatars.value[identity] || '';
  return url.startsWith('http')
    ? url
    : `https://s3.amazonaws.com/keybase_processed_uploads/${url}`;
};

const list = computed(() => {
    return providers.value.map((x: any) => {
      x.logo = logo(x.description.identity);
      return x;
    });
});

loadAvatars();
</script>
<template>
  <div>
    <div>
      <div
        class="bg-base-100 rounded-lg grid sm:grid-cols-1 md:grid-cols-4 p-4"
      >
        <div class="flex">
          <span>
            <div
              class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2"
            >
              <Icon class="text-success" icon="mdi:trending-up" size="32" />
              <div
                class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-success"
              ></div>
            </div>
          </span>
          <span>
            <div class="font-bold">Number of providers</div>
            <div class="text-xs">{{providers.length}}</div>
          </span>
        </div>
        <div class="flex">
          <span>
            <div
              class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2"
            >
              <Icon
                class="text-primary"
                icon="mdi:lock-open-outline"
                size="32"
              />
              <div
                class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-primary"
              ></div>
            </div>
          </span>
          <span>
            <div class="font-bold">Jailed providers</div>
            <div class="text-xs">{{1}}</div>
          </span>
        </div>
        <div class="flex">
          <span>
            <div
              class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2"
            >
              <Icon
                class="text-error"
                icon="mdi:alert-octagon-outline"
                size="32"
              />
              <div
                class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-error"
              ></div>
            </div>
          </span>
          <span>
            <div class="font-bold">Frozen providers</div>
            <div class="text-xs">{{1}}</div>
          </span>
        </div>
        <div class="flex">
          <span>
            <div
              class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2"
            >
              <Icon class="text-error" icon="mdi:money" size="32" />
              <div
                class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-error"
              ></div>
            </div>
          </span>
          <span>
            <div class="font-bold">Min stake for provider</div>
            <div class="text-xs"> {{
                format.formatToken(
                    {
                      amount: parseInt(spec?.Spec?.min_stake_provider?.amount).toString(),
                      denom: staking.params.bond_denom,
                    },
                    true,
                    '0,0'
                )
              }}</div>
          </span>
        </div>
      </div>
    </div>
    <div class="bg-base-100 px-4 pt-3 pb-4 rounded shadow">
      <div class="overflow-x-auto">
        <table class="table staking-table w-full">
          <thead class="bg-base-200">
            <tr>
              <th
                scope="col"
                class="uppercase"
                style="width: 3rem; position: relative"
              >
                {{ $t('staking.rank') }}
              </th>
              <th scope="col" class="uppercase">Provider</th>
              <th scope="col" class="text-right uppercase">
                 Total Delegations
              </th>
              <th scope="col" class="text-right uppercase">Services</th>
              <th scope="col" class="text-right uppercase">
                {{ $t('staking.commission') }}
              </th>
              <th scope="col" class="text-center uppercase">
                {{ $t('staking.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              class="hover:bg-gray-100 dark:hover:bg-[#384059]"
              v-for="provider in list"
              :key="provider.provider"
            >
              <!--              rank! -->
              <td>
                <div
                  class="text-xs truncate relative px-2 py-1 rounded-full w-fit"
                  :class="`text-1`"
                >
                  <span
                    class="inset-x-0 inset-y-0 opacity-10 absolute"
                    :class="`bg-1`"
                  ></span>
                  {{ provider.rank }}
                </div>
              </td>
              <!-- 👉 Validator -->
              <td>
                <div
                  class="flex items-center overflow-hidden"
                  style="max-width: 300px"
                >
                  <div class="avatar mr-4 relative w-8 h-8 rounded-full">
                    <div
                      class="w-8 h-8 rounded-full bg-gray-400 absolute opacity-10"
                    ></div>
                    <div class="w-8 h-8 rounded-full">
                      <img
                        v-if="provider.logo"
                        :src="provider.logo"
                        class="object-contain"
                        @error="
                          (e) => {
                            const identity = provider.description?.identity;
                            if (identity) loadAvatar(identity);
                          }
                        "
                      />
                      <Icon
                        v-else
                        class="text-3xl"
                        :icon="`mdi-help-circle-outline`"
                      />
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <span
                      class="text-sm text-primary dark:invert whitespace-nowrap overflow-hidden"
                    >
                      <RouterLink
                        :to="{
                          name: 'chain-providers-provider',
                          params: {
                            provider: provider.provider,
                          },
                        }"
                        class="font-weight-medium"
                      >
                        {{ provider?.description?.moniker || provider.moniker }}
                      </RouterLink>
                    </span>
                    <span class="text-xs">{{
                      provider.description?.website ||
                      provider.description?.identity ||
                      '-'
                    }}</span>
                  </div>
                </div>
              </td>
              <!-- 👉 Total stake  -->
              <td class="text-right">
                <div class="flex flex-col">
                  <h6 class="text-sm font-weight-medium whitespace-nowrap">
                    {{
                      format.formatToken(
                        {
                          amount: parseInt(provider.total_delegations.amount).toString(),
                          denom: staking.params.bond_denom,
                        },
                        true,
                        '0,0'
                      )
                    }}
                  </h6>
                </div>
              </td>
              <td class="text-right text-xs">
                <div class="flex items-center justify-end">
                  <span>{{ provider.chains.length }}</span>
                  <Popper placement="top" hover>
                    <template #default>
                      <Icon icon="mdi-help-circle-outline" class="text-regular cursor-pointer ml-1" />
                    </template>
                    <template #content>
                      <div class="tooltip-content">
                        {{ provider.chains.join(', ') }}
                      </div>
                    </template>
                  </Popper>
                </div>
              </td>
              <!-- 👉 commission -->
              <td class="text-right text-xs">
                {{ provider.delegate_commission }}%
              </td>
              <!-- 👉 commission -->
              <td class="text-center">
                <div
                  v-if="Number(provider.jailed_until) === 0"
                  class="badge badge-error gap-2 text-white"
                >
                  {{ $t('staking.jailed') }}
                </div>
                <label
                  v-else
                  for="lava_restake"
                  class="btn btn-xs btn-primary rounded-sm capitalize"
                  @click="dialog.open('lava_restake', { provider_address: provider.address, chain_id: provider.chain })"
                  >restake</label>
              </td>
            </tr>
          </tbody>
        </table>
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

<route>
    {
      meta: {
        i18n: 'providers',
        order: 2
      }
    }
</route>
  