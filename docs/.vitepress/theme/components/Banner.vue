<script setup lang="ts">
</script>

<template>
  <div class="iata-banner">
    <div class="iata-banner-inner">
      <span class="iata-banner-icon">📘</span>
      Validated against the
      <strong>IATA SSIM, March 2012 edition</strong>.
      Have access to a newer edition?
      <a href="https://github.com/skhrvg/iata-ssim/issues" target="_blank" rel="noopener">Open an issue</a>
      and we'll incorporate the diff.
    </div>
  </div>
</template>

<style scoped>
.iata-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  z-index: 60;
  display: flex;
  align-items: center;
  background-color: var(--vp-c-bg);
  background-image: linear-gradient(var(--vp-c-brand-soft), var(--vp-c-brand-soft));
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 24px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  box-sizing: border-box;
}

.iata-banner-inner {
  max-width: 1500px;
  margin: 0 auto;
  text-align: center;
}

.iata-banner-inner strong {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.iata-banner-inner a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.iata-banner-inner a:hover {
  color: var(--vp-c-brand-2);
}

.iata-banner-icon {
  margin-right: 4px;
}

@media (max-width: 640px) {
  .iata-banner {
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>
