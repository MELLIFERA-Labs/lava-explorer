<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Lava-specific quick actions
const quickActions = [
  {
    title: 'Staking',
    description: 'Secure the network and earn rewards by staking LAVA tokens',
    icon: 'mdi:shield-account',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    route: '/lava/staking',
    features: ['Delegate to Validators', 'Earn Staking Rewards', 'Network Security']
  },
  {
    title: 'Providers',
    description: 'Explore and restake to RPC providers for additional rewards',
    icon: 'mdi:server-network',
    color: 'text-success',
    bgColor: 'bg-success/10',
    route: '/lava/providers',
    features: ['RPC Infrastructure', 'Provider Rewards', 'Restake']
  },
  {
    title: 'IPRPC Pools',
    description: 'View incentivized pools and reward distributions',
    icon: 'mdi:pool',
    color: 'text-info',
    bgColor: 'bg-info/10',
    route: '/lava/iprpc',
    features: ['Monthly Rewards data', 'Next payout countdown']
  },
  {
    title: 'Supported Chains',
    description: 'Browse all blockchain networks supported by Lava',
    icon: 'mdi:link-variant',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    route: '/lava/chains',
    features: ['Multi-Chain Support', 'Provider Network', 'API Endpoints']
  }
];

// Recent stats (placeholder - you can connect to real APIs)
const stats = ref([
  { label: 'Total Staked', value: '600M+ LAVA', icon: 'mdi:lock' },
  { label: 'Active Validators', value: '90+', icon: 'mdi:shield-check' },
  { label: 'RPC Providers', value: '80+', icon: 'mdi:server' },
  { label: 'Supported Chains', value: '45+', icon: 'mdi:link' }
]);

const navigateTo = (route: string) => {
  router.push(route);
};
</script>

<!-- <template>

</script> -->
<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <div class="flex md:!flex-row flex-col items-center justify-center mb-6 mt-8 gap-4">
        <div class="w-20 rounded-full">
          <svg class="w-full h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 374.999991">
            <defs>
              <clipPath id="clip1">
                <path d="M 9.140625 9.140625 L 365.859375 9.140625 L 365.859375 365.859375 L 9.140625 365.859375 Z M 9.140625 9.140625 "/>
              </clipPath>
              <clipPath id="clip2">
                <path d="M 313.574219 61.363281 L 313.636719 61.425781 C 347.074219 94.863281 365.859375 140.214844 365.859375 187.5 C 365.859375 234.785156 347.074219 280.136719 313.636719 313.574219 L 313.574219 313.636719 C 280.136719 347.074219 234.785156 365.859375 187.5 365.859375 C 140.214844 365.859375 94.863281 347.074219 61.425781 313.636719 L 61.363281 313.574219 C 27.925781 280.136719 9.140625 234.785156 9.140625 187.5 C 9.140625 140.214844 27.925781 94.863281 61.363281 61.425781 L 61.425781 61.363281 C 94.863281 27.925781 140.214844 9.140625 187.5 9.140625 C 234.785156 9.140625 280.136719 27.925781 313.574219 61.363281 Z M 313.574219 61.363281 "/>
              </clipPath>
              <clipPath id="clip3">
                <path d="M 130.023438 130.023438 L 244.976562 130.023438 L 244.976562 244.976562 L 130.023438 244.976562 Z M 130.023438 130.023438 "/>
              </clipPath>
              <clipPath id="clip4">
                <path d="M 187.5 130.023438 C 155.757812 130.023438 130.023438 155.757812 130.023438 187.5 C 130.023438 219.242188 155.757812 244.976562 187.5 244.976562 C 219.242188 244.976562 244.976562 219.242188 244.976562 187.5 C 244.976562 155.757812 219.242188 130.023438 187.5 130.023438 Z M 187.5 130.023438 "/>
              </clipPath>
            </defs>
            <g clip-path="url(#clip1)">
              <g clip-path="url(#clip2)">
                <path fill="none" stroke="#cd4546" stroke-width="15.768828" d="M 128.014464 21.959245 L 128.040745 21.985526 C 142.101283 36.046064 150.00048 55.11649 150.00048 74.999996 C 150.00048 94.883502 142.101283 113.953928 128.040745 128.014466 L 128.014464 128.040747 C 113.953926 142.101285 94.8835 150.000482 74.999994 150.000482 C 55.116488 150.000482 36.046062 142.101285 21.985525 128.040747 L 21.959243 128.014466 C 7.898705 113.953928 -0.00049176 94.883502 -0.00049176 74.999996 C -0.00049176 55.11649 7.898705 36.046064 21.959243 21.985526 L 21.985525 21.959245 C 36.046062 7.898707 55.116488 -0.000489868 74.999994 -0.000489868 C 94.8835 -0.000489868 113.953926 7.898707 128.014464 21.959245 Z M 128.014464 21.959245 " transform="matrix(2.37811,0,0,2.37811,9.141794,9.14179)"/>
              </g>
            </g>
            <g clip-path="url(#clip3)">
              <g clip-path="url(#clip4)">
                <path fill="#cd4546" d="M 130.023438 130.023438 L 244.976562 130.023438 L 244.976562 244.976562 L 130.023438 244.976562 Z M 130.023438 130.023438 "/>
              </g>
            </g>
          </svg>
        </div>
        <div class="text-center md:text-left">
          <h1 class="text-4xl md:text-6xl font-bold text-primary mb-2">
            LavaCenter
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300">
            Your Gateway to the Lava Network
          </p>
        </div>
      </div>
      
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        Explore, stake, and interact with the Lava blockchain ecosystem. Manage your delegations, 
        discover RPC providers, and participate in the decentralized infrastructure revolution.
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      <div 
        v-for="stat in stats" 
        :key="stat.label"
        class="bg-base-100 rounded-lg p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <Icon :icon="stat.icon" class="text-3xl text-primary mb-2 mx-auto" />
        <div class="text-2xl font-bold text-primary mb-1 text-center ml-4">{{ stat.value }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Quick Actions Grid -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-center mb-8">Get Started with Lava</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="action in quickActions" 
          :key="action.title"
          class="bg-base-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
          @click="navigateTo(action.route)"
        >
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center mr-3" :class="action.bgColor">
              <Icon :icon="action.icon" class="text-2xl" :class="action.color" />
            </div>
            <h3 class="text-lg font-semibold group-hover:text-primary transition-colors">
              {{ action.title }}
            </h3>
          </div>
          
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {{ action.description }}
          </p>
          
          <div class="space-y-1">
            <div 
              v-for="feature in action.features" 
              :key="feature"
              class="flex items-center text-xs text-gray-500 dark:text-gray-400"
            >
              <Icon icon="mdi:check-circle" class="text-success mr-2 text-sm" />
              {{ feature }}
            </div>
          </div>
          
          <div class="mt-4 flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            Explore <Icon icon="mdi:arrow-right" class="ml-1" />
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Features -->
    <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold mb-4">Why Choose Lava?</h2>
        <p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Lava is building the decentralized infrastructure layer for Web3, providing reliable, 
          scalable, and censorship-resistant access to blockchain data.
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:lightning-bolt" class="text-3xl text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Fast & Reliable</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">
            Lightning-fast RPC responses with 99.9% uptime guaranteed by our provider network.
          </p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:shield-check" class="text-3xl text-success" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Secure & Decentralized</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">
            Trustless infrastructure with cryptographic proofs and distributed provider network.
          </p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:cash-multiple" class="text-3xl text-warning" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Earn Rewards</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">
            Stake LAVA tokens and restake to providers to earn rewards while securing the network.
          </p>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-4">Ready to Get Started?</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Connect your wallet and start participating in the Lava ecosystem today.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          class="btn btn-primary btn-lg"
          @click="navigateTo('/lava/providers')"
        >
          <Icon icon="mdi:shield-account" class="mr-2" />
          Start ReStaking
        </button>
        <button 
          class="btn btn-outline btn-lg"
          @click="navigateTo('/lava/providers')"
        >
          <Icon icon="mdi:server-network" class="mr-2" />
          Explore Providers
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
