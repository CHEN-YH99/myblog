<template>
  <!-- 海水波浪 -->
  <div class="wave-container">
    <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
      <defs>
        <path id="gentle-wave"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
      </defs>
      <g class="parallax">
        <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" />
        <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
        <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
        <use xlink:href="#gentle-wave" x="48" y="7" fill="#fff" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">


</script>

<style scoped lang="scss">
/* ========== Waves ========== */
 .wave-container {
   position: absolute;
   bottom: 0;
   left: 0;
   width: 100%;
   overflow: hidden;
   line-height: 0;
   transform: translateZ(0);
   will-change: transform;
   pointer-events: none;
 }

 .waves {
   position: relative;
   width: 100%;
   height: var(--wave-height);
   min-height: 0;
   margin-bottom: 0;
   transform: translateZ(0);
   backface-visibility: hidden;
 }

 /* 海浪色调 */
 .parallax > use:nth-child(1) {
   fill: rgba(135, 206, 235, 0.4);
 }
 .parallax > use:nth-child(2) {
   fill: rgba(135, 206, 235, 0.6);
 }
 .parallax > use:nth-child(3) {
   fill: rgba(135, 206, 235, 0.8);
 }
 .parallax > use:nth-child(4) {
   fill: rgba(176, 224, 230, 1);
 }

 /* 海浪动画 */
 .parallax > use {
   animation: move-forever 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
   transform-origin: center;
   backface-visibility: hidden;
   perspective: 1000px;
 }
 .parallax > use:nth-child(1) {
   animation-delay: -2s;
   animation-duration: 7s;
 }
 .parallax > use:nth-child(2) {
   animation-delay: -3s;
   animation-duration: 10s;
 }
 .parallax > use:nth-child(3) {
   animation-delay: -4s;
   animation-duration: 13s;
 }
 .parallax > use:nth-child(4) {
   animation-delay: -5s;
   animation-duration: 20s;
 }
 @keyframes move-forever {
   0% {
     transform: translate3d(-90px, 0, 0);
   }
   100% {
     transform: translate3d(85px, 0, 0);
   }
 }
</style>