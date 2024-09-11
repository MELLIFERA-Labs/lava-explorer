<script setup lang="ts">
import ApexCharts from 'vue3-apexcharts';
import { computed, type PropType } from 'vue';
import { useFormatter } from '@/stores';
import type { CommissionRate } from '@/types';

const props = defineProps({
  commission: { type: Number },
});

let rate = computed(
    () => Number(props.commission || 0)
);
let max = computed(
    () => 100 // The max value is always 100
);

const series = computed(() => [rate.value, max.value - rate.value]);

const format = useFormatter();

const chartConfig = computed(() => {
  const secondaryText = `hsl(var(--bc))`;
  const primaryText = `hsl(var(--bc))`;

  return {
    chart: {
      width: '200px',
      sparkline: { enabled: false },
    },
    colors: ['rgba(114,225,40,0.8)', 'rgba(109,120,141,0.2)'],
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      lineCap: 'round',
      colors: ['hsl(var(--b1))'],
    },
    labels: [
      'Commission Rate',
      'Remaining'
    ],
    states: {
      hover: {
        filter: { type: 'none' },
      },
      active: {
        filter: { type: 'none' },
      },
    },
    plotOptions: {
      pie: {
        endAngle: 360,
        startAngle: 0,
        customScale: 1,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              offsetY: 25,
              fontSize: '1rem',
              color: secondaryText,
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              fontSize: '2.125rem',
              formatter: (value: unknown) => `${rate.value.toFixed(1)}%`,
              color: primaryText,
            },
            total: {
              show: true,
              label: 'Commission Rate',
              fontSize: '1rem',
              color: secondaryText,
              formatter: () => `${rate.value.toFixed(1)}%`,
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 1709,
        options: {
          chart: { height: 237 },
        },
      },
    ],
  };
});
</script>

<template>
  <div class="bg-base-100 rounded shadow p-4">
    <div class="text-lg text-main font-semibold mb-1">Commission Rate</div>
    <div class="w-80 m-auto">
      <ApexCharts type="donut" :options="chartConfig" :series="series" />
    </div>
    <div>
      <div class="flex items-center justify-center flex-wrap gap-x-3">
        <div class="flex items-center gap-x-2">
          <div class="bg-success w-[6px] h-[6px] rounded-full"></div>
          <span class="text-caption">Rate: {{ rate.toFixed(0) }}%</span>
        </div>
        <div class="flex items-center gap-x-2">
          <div class="bg-secondary w-[6px] h-[6px] rounded-full"></div>
          <span class="text-caption">Max: {{ max }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
