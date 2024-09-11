<script lang="ts" setup>
import { useTxDialog, useBlockchain } from '@/stores';
import TxDialog from "@/widget-lib/components/TxDialog/index.vue";
const store = useTxDialog();
const chainStore = useBlockchain()
</script>
<template>
  <TxDialog
    :type="store.type"
    :sender="store.sender"
    :endpoint="store.endpoint"
    :params='store.params'
    :hd-path="store.hdPaths"
    :registry-name="chainStore.current?.prettyName || chainStore.chainName"
    @view="store.view"
    @confirmed="store.confirmed"
  ></TxDialog>
</template>
