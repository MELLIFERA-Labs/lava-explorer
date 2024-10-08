import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores/useBlockchain';
import { useDashboard } from '@/stores/useDashboard';

function attachMeta(specs: any[], specsMeta?: any) {
  return specs.map((spec: any) => {
    const index = spec.index || spec.chainID;
    if (index in specsMeta) {
      spec.meta = specsMeta[spec.index || spec.chainID];
    }
    return spec;
  });
}
export const useLavaSpecStore = defineStore('specStore', {
    state: () => {
        return {
            specs: [] as any[],
            enabledSpecs: [] as any[],
            supportedChains: [] as any[],
        }
    },
    getters: {
        blockchain() {
            return useBlockchain();
        },
        dashboard() {
            return useDashboard();
        }
    },
    actions: {
       async getSpecs() {
            const allSpecs = await this.blockchain.rpc?.getLavaSpecs();
            const specsMeta = await this.dashboard.chains[this.blockchain.chainName].lava_specs_meta;
            return attachMeta(allSpecs.Spec, specsMeta);
        },
        async getEnabledSpecs() {
            const allSpecs = await this.getSpecs();
            const enabledSpecs =  allSpecs.filter((spec: any) => spec.enabled === true);
            const specsMeta = await this.dashboard.chains[this.blockchain.chainName].lava_specs_meta;
            return attachMeta(enabledSpecs, specsMeta);
        },
        async getLavaSupportedChains({enabled = true}: { enabled?: boolean } = {}) {

            const supportedChains = await this.blockchain.rpc?.getLavaSupportedChains();
            const specsMeta = await this.dashboard.chains[this.blockchain.chainName].lava_specs_meta;
            // todo: filter by enabled field when Lava supports for show_all_chains query
            if(!enabled) {
                const filteredChains = supportedChains.chainInfoList.filter((chain: any) => !this.dashboard.chains[this.blockchain.chainName]?.disabled_specs?.includes(chain.chainID));
                return attachMeta(filteredChains, specsMeta);
            }
            return attachMeta(supportedChains.chainInfoList, specsMeta);
        },
        async getLavaSpecByChainID(chainID: string) {
            return await this.blockchain.rpc?.getLavaSpecByChainID(chainID);
        }
    }
});