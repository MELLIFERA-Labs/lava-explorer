import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores/useBlockchain';
import bignumber from 'bignumber.js';
import dayjs from 'dayjs';

function isJailed(jailedEndTimeUnix?: number) {
  if (!jailedEndTimeUnix) return false;
  const timestampTime = dayjs.unix(jailedEndTimeUnix);
  return timestampTime.isAfter(dayjs());
}

function getProviderStatus(latestHeight: number, provider: any) {
  if (isJailed(provider.jail_end_time)) {
    return 'jailed';
  }
  if (Number(provider.stake_applied_block) > Number(latestHeight)) {
    return 'frozen';
  }
  return 'active';
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
      allProviders: {
        stakeEntry: [],
      },
      latestHeight: 0,
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    async fetchLatestHeight() {
      const latestBlock = await this.blockchain.rpc?.getBaseBlockLatest();
      this.latestHeight = Number(latestBlock.block.header.height);
    },
    async ensureLatestHeight() {
      if (this.latestHeight === 0) {
        await this.fetchLatestHeight();
      }
    },
    async reloadProviders(chainName: string) {
        this.allProviders = await this.blockchain.rpc?.getLavaProviders(chainName, true);
    },
    async getAllProviders(chainName: string) {
      if(!this.allProviders.stakeEntry.length) {
        this.allProviders = await this.blockchain.rpc?.getLavaProviders(chainName, true);
        return this.allProviders;
      }
      return this.allProviders;
    },
    // todo: should we remove this?
    async getProviderByAddress(address: string, chainName: string) {
      await this.ensureLatestHeight();
      const providersResponse = await this.getAllProviders(chainName);
      const provider = providersResponse.stakeEntry.find(
        (provider: { address: string }) => provider.address === address
      );
      if (!provider) {
        return null;
      }
      const [providerWithTotalStake] = addTotalStakeAndJailed([provider]);
      providerWithTotalStake.status = getProviderStatus(
        this.latestHeight,
        providerWithTotalStake
      );
      return providerWithTotalStake;
    },
    async getProviderMetadata(address: string) {
      const metadata = await this.blockchain.rpc?.getProviderMetadata(address);
      const [ providerMetadata ] = metadata.MetaData;
      return providerMetadata; 
    },
    async getProvidersMetadata() {
      const metadata = await this.blockchain.rpc?.getProvidersMetadata();
      const sortedByTotalStake = metadata?.MetaData.sort((a: any, b: any) => {
        return bignumber(b.total_delegations.amount).minus(a.total_delegations.amount).toNumber();
      }).map((provider: any, index: number) => {
        provider.rank = index + 1;
        return provider;
      });
      return sortedByTotalStake;
    },
    async getProviderChains(address: string) {
      await this.ensureLatestHeight();
      const providersResponse = await this.blockchain.rpc?.getProviderChains(
        address
      );
      const providersWithTotalStake = addTotalStakeAndJailed(
        providersResponse.stakeEntries
      );
      return providersWithTotalStake.map((provider: any) => {
        provider.status = getProviderStatus(this.latestHeight, provider);
        return provider;
      });
    },
    async providerCus(chainName: string, provider: string) {
      const res = await this.blockchain.rpc?.getProvidersCUs(chainName, provider);
      const [providerCU] = res.info;
      return providerCU;
    },
    async getActiveProviders(chainName: string) {
      await this.ensureLatestHeight();
      const providersResponse = await this.getAllProviders(chainName);
      const activeProviders = providersResponse.stakeEntry.filter(
        (provider: { stake_applied_block: string }) =>
          Number(provider.stake_applied_block) <= Number(this.latestHeight)
      );
      const activeProvidersWithTotalStake =
        addTotalStakeAndJailed(activeProviders);
      const sortedByTotalStake = activeProvidersWithTotalStake
        .sort((a: any, b: any) => {
          return bignumber(b.total_stake).minus(a.total_stake).toNumber();
        })
        .map((provider: any, index: number) => {
          provider.rank = index + 1;
          return provider;
        })
        .filter((provider: any) => !provider.jailed);
      return sortedByTotalStake;
    },
    async getFrozenProviders(chainName: string) {
      await this.ensureLatestHeight();
      const providersResponse = await this.getAllProviders(chainName);
      const frozenProviders = providersResponse.stakeEntry.filter(
        (provider: { stake_applied_block: string }) =>
          Number(provider.stake_applied_block) > Number(this.latestHeight)
      );
      const frozenProvidersWithTotalStake = addTotalStakeAndJailed(
        frozenProviders
      )
        .map((p) => {
          p.rank = 0;
          return p;
        })
        .filter((provider: any) => !provider.jailed);
      return frozenProvidersWithTotalStake;
    },
    async getJailedProviders(chainName: string) {
      await this.ensureLatestHeight();
      const providersResponse = await this.getAllProviders(chainName);
      const providersWithData = addTotalStakeAndJailed(
        providersResponse.stakeEntry
      );
      const jailedProviders = providersWithData.filter(
        (provider: any) => provider.jailed === true
      );
      return jailedProviders;
    },
  },
});
