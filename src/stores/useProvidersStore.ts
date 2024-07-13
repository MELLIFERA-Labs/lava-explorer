import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores/useBlockchain';
import bignumber from 'bignumber.js';
import dayjs from "dayjs";
function isJailed(jailedEndTimeUnix?: number) {
  if (!jailedEndTimeUnix) return false;
  const timestampTime = dayjs.unix(jailedEndTimeUnix);
  return timestampTime.isAfter(dayjs());
}
function addTotalStakeAndJailed(providers: any[]) {
  return providers.map((provider: any) => {
    const totalStake = bignumber(provider.delegate_total.amount)
      .plus(provider.stake.amount)
      .toString();
    provider.total_stake = totalStake;
    provider.jailed = isJailed(provider.jail_end_time);
    return provider;
  });
}

export const useLavaProvidersStore = defineStore('providersStore', {
  state: () => {
    return {
      frozenProviders: [] as any[],
      jailedProviders: [] as any[],
      activeProviders: [] as any[],
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    getAllProviders(chainName: string) {
      return this.blockchain.rpc?.getLavaProviders(chainName, true);
    },
    async getProviderByAddress(address: string, chainName: string,) {
        const providersResponse = await this.getAllProviders(chainName);
        const provider = providersResponse.stakeEntry.find(
            (provider: { address: string }) => provider.address === address
        );
        if (!provider) {
            return null;
        }
        const [prividerWithTotalStake] = addTotalStakeAndJailed([provider]);
        return prividerWithTotalStake;
    },
    async getActiveProviders(chainName: string) {
      const latestBlock = await this.blockchain.rpc?.getBaseBlockLatest();
      const latestHeight = latestBlock.block.header.height;
      const providersResponse = await this.blockchain.rpc?.getLavaProviders(
        chainName
      );
      const activeProviders = providersResponse.stakeEntry.filter(
        (provider: { stake_applied_block: string }) =>
          Number(provider.stake_applied_block) <= Number(latestHeight)
      );
      const activeProvidersWithTotalStake = addTotalStakeAndJailed(activeProviders);
      const sortedByTotalStake = activeProvidersWithTotalStake.sort(
        (a: any, b: any) => {
          return bignumber(b.total_stake).minus(a.total_stake).toNumber();
        }
      ).map((provider: any, index: number) => {
        provider.rank = index + 1;
        return provider;
      }).filter((provider: any) => !provider.jailed);
      return sortedByTotalStake;
    },
    async getFrozenProviders(chainName: string) {
      const latestBlock = await this.blockchain.rpc?.getBaseBlockLatest();
      const latestHeight = latestBlock.block.header.height;
      const providersResponse = await this.getAllProviders(chainName);
      const frozenProviders = providersResponse.stakeEntry.filter(
        (provider: { stake_applied_block: string }) =>
          Number(provider.stake_applied_block) > Number(latestHeight)
      );
      const frozenProvidersWithTotalStake = addTotalStakeAndJailed(frozenProviders).map(p => {
        p.rank = 0;
        return p;
      }).filter((provider: any) => !provider.jailed)
      return frozenProvidersWithTotalStake;
    },
    async getJailedProviders(chainName: string) {
        const providersResponse = await this.getAllProviders(chainName);
        const providersWithData = addTotalStakeAndJailed(providersResponse.stakeEntry);
        const jailedProviders = providersWithData.filter(
            (provider: any) => provider.jailed === true
        );
        return jailedProviders;
    }
  },
});
