import {defineStore} from 'pinia';
import {useBlockchain} from './useBlockchain';
import {fromBech32, toBech32} from '@cosmjs/encoding';
import type {Coin, Delegation, DelegatorRewards, UnbondingResponses, WalletConnected,} from '@/types';
import {useStakingStore} from './useStakingStore';
import router from '@/router'

export const useWalletStore = defineStore('walletStore', {
  state: () => {
    return {
      balances: [] as Coin[],
      delegations: [] as Delegation[],
      unbonding: [] as UnbondingResponses[],
      rewards: {total: [], rewards: []} as DelegatorRewards,
      wallet: {} as WalletConnected,
      providerDelegations: [] as any[],
      providerRewards: {} as {rewards: any[]},
      emptyDelegation: {} as any,
      userProviders: {} as any,
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
    connectedWallet() {
      // @ts-ignore
      if(this.wallet.cosmosAddress) return this.wallet
      const chainStore = useBlockchain();
      const key = chainStore.defaultHDPath;
      const connected = JSON.parse(localStorage.getItem(key) || '{}');
      return connected
    },
    balanceOfStakingToken(): Coin {
      const stakingStore = useStakingStore();
      return (
        this.balances.find(
          (x) => x.denom === stakingStore.params.bond_denom
        ) || { amount: '0', denom: stakingStore.params.bond_denom }
      );
    },
    stakingAmount() {
      const stakingStore = useStakingStore();
      let amt = 0;
      let denom = stakingStore.params.bond_denom;
      this.delegations.forEach((i) => {
        amt += Number(i.balance.amount);
        denom = i.balance.denom;
      });
      return { amount: String(amt), denom };
    },
    rewardAmount() {
      const stakingStore = useStakingStore();
      // @ts-ignore
      const reward = this.rewards.total?.find(
        (x: Coin) => x.denom === stakingStore.params.bond_denom
      );
      return reward || { amount: '0', denom: stakingStore.params.bond_denom };
    },
    rewardAmountLava() {
      const stakingStore = useStakingStore();
      // @ts-ignore
      const totalRewards = this.providerRewards.rewards?.reduce((total, reward) => {
        return total + reward.amount.reduce((sum: bigint, amountObj: {denom: string, amount: string}) => {
          return sum + (amountObj.denom === stakingStore.params.bond_denom ? BigInt(amountObj.amount) : BigInt(0));
        }, BigInt(0));
      }, BigInt(0));
      return totalRewards ? { amount: totalRewards.toString(), denom: stakingStore.params.bond_denom } : { amount: '0', denom: stakingStore.params.bond_denom };
    },
    unbondingAmount() {
      let amt = 0;
      this.unbonding.forEach((i) => {
        i.entries.forEach((e) => {
          amt += Number(e.balance);
        });
      });

      const stakingStore = useStakingStore();
      return { amount: String(amt), denom: stakingStore.params.bond_denom };
    },
    currentAddress() {
      if (!this.connectedWallet?.cosmosAddress) return '';
      const { prefix, data } = fromBech32(this.connectedWallet.cosmosAddress);
      const chainStore = useBlockchain();
      return toBech32(chainStore.current?.bech32Prefix || prefix, data);
    },
    shortAddress() {
      const address: string = this.currentAddress
      if(address.length > 4) {
        return `${address.substring(address.length -4)}`
      }
      return ""
    }
  },
  actions: {

    async loadMyAsset() {
      if (!this.currentAddress) return;
      this.blockchain.rpc.getBankBalances(this.currentAddress).then((x) => {
        this.balances = x.balances;
      });
      this.blockchain.rpc
        .getStakingDelegations(this.currentAddress)
        .then((x) => {
          this.delegations = x.delegation_responses;
        });
      this.blockchain.rpc
        .getStakingDelegatorUnbonding(this.currentAddress)
        .then((x) => {
          this.unbonding = x.unbonding_responses;
        });
      this.blockchain.rpc
        .getDistributionDelegatorRewards(this.currentAddress)
        .then((x) => {
          this.rewards = x;
        });
    },
    loadLavaAsset() {
      if (!this.currentAddress) return;
       this.blockchain.rpc.getRewardsFromProvider(this.currentAddress).then((x) => {
         console.log('provv231231231-=.',x)
        this.providerRewards = x;
      });
       this.blockchain.rpc.delegatorProviders(this.currentAddress).then((x:any) => {
          this.emptyDelegation = x.delegations.find(
              (p: { provider: string }) => p.provider === 'empty_provider'
          );
          this.providerDelegations = x.delegations.filter(
                (p: { provider: string }) => p.provider !== 'empty_provider'
            );
          return x
       }).then((x: any) => {
          for (const p of x.delegations) {
            if (this.userProviders[p.provider]) {
              continue;
            }
            this.blockchain.rpc.getProviderChains(p.provider).then((providers) => {
              const providerWithMoniker = providers.stakeEntries.find(
                  (p: { moniker: string; description: { moniker: string } }) =>
                      p?.moniker?.length ?? p?.description?.moniker?.length
              );
              if (!providerWithMoniker) {
                this.userProviders = {
                  ...this.userProviders,
                  [p.provider]: {},
                };
                return;
              }
              this.userProviders = {
                ...this.userProviders,
                [p.provider]: providerWithMoniker,
              };
            });
          }
       })
    },

    getProviderName(address: string) {
      if (!this.currentAddress) return 'unknown';
      return (this.userProviders[address]?.moniker || this.userProviders[address]?.description?.moniker) ?? this.currentAddress;
    },
    myBalance() {
      return this.blockchain.rpc.getBankBalances(this.currentAddress);
    },
    myDelegations() {
      return this.blockchain.rpc.getStakingDelegations(this.currentAddress);
    },
    myUnbonding() {
      return this.blockchain.rpc.getStakingDelegatorUnbonding(
        this.currentAddress
      );
    },
    disconnect() {
      const chainStore = useBlockchain();
      const key = chainStore.defaultHDPath;
      localStorage.removeItem(key);
      this.$reset()
    },
    setConnectedWallet(value: WalletConnected) {
      if(value) this.wallet = value 
    },
    suggestChain() {
      if (window.location.pathname === '/SIDE-Testnet') {
        router.push({path: '/wallet/unisat'})
      } else {
        router.push({path: '/wallet/keplr'})
      }
    }
  },
});