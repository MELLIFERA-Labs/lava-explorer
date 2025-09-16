import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue';

interface CountdownOptions {
  initialSeconds: Ref<number>;
}

export function useCountdown(options: CountdownOptions) {
  const remainingTime = ref(options.initialSeconds);


  const days = computed(() => Math.floor(remainingTime.value / (24 * 3600)));
  const hours = computed(() => Math.floor((remainingTime.value % (24 * 3600)) / 3600));
  const minutes = computed(() => Math.floor((remainingTime.value % 3600) / 60));
  const seconds = computed(() => remainingTime.value % 60);

  let timer: NodeJS.Timeout;

  const updateCountdown = () => {
    if (remainingTime.value > 0) {
      remainingTime.value--;
    }
  };

  onMounted(() => {
    timer = setInterval(updateCountdown, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  return {
    days,
    hours,
    minutes,
    seconds
  };
}
