<template>
  <!-- footer -->
  <footer
      class="flex flex-col md:flex-row items-center h-auto md:h-12 mt-5 text-sm bg-gray-100 dark:bg-[#171d30] py-2 z-10 w-full"
  >
    <div class="flex flex-wrap items-center justify-center md:justify-start flex-1 text-center md:text-left">
      &copy;&nbsp;{{ new Date().getFullYear() }}&nbsp;
      Made With&nbsp;<img src="../../assets/images/heart.svg" class="inline-block w-4 h-4" />&nbsp;
      By&nbsp;<a
        class="link link-primary no-underline"
        href="https://ping.pub"
        target="_blank"
        rel="noopener noreferrer"
    >Ping.pub</a>
      &nbsp; modified for LAVA by <a
        class="link link-primary no-underline"
        href="https://mellifera.network"
        target="_blank"
        rel="noopener noreferrer"
        style="color: #ffea00;"
    >&nbsp; MELLIFERA</a>
    </div>
    <div
        class="flex justify-center md:justify-end mt-2 md:mt-0"
    >
      <a
          class="link link-primary no-underline mr-4"
          href="https://github.com/mellifera-labs/lava-explorer/blob/master/LICENSE"
          target="noopener noreferrer"
      >License</a>
      <a
          class="link link-primary no-underline"
          href="https://github.com/mellifera-labs/lava-explorer"
          target="noopener noreferrer"
      >GitHub</a>
    </div>
  </footer>
</template>
