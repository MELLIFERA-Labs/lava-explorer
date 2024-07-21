<script setup lang="ts">
import { themeChange } from 'theme-change';
import { onMounted } from 'vue';
import TxDialog from './components/TxDialog.vue';

onMounted(() => {
  themeChange(false);
});
</script>

<template>
  <div>
   <!--    Add ability to reuse component provider profile, but broke validator images  -->
    <RouterView  :key="$route.path"/>
    <TxDialog />
  </div>
</template>
