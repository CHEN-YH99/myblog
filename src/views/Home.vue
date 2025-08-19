<template>
	<div class="home-page">
		<!-- 头部图片 -->
		<div class="header">
			<div class="inner-header flex">
				<h1>小灰个人博客</h1>
			</div>
			<el-icon color="#ffffff" size="24px" class="turndown"><arrow-down-bold /></el-icon>

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
		</div>
		<!-- 内容 -->
		 <div class="main-content">
			<!-- 回到顶部 -->
			<el-backtop :right="100" :bottom="100" />
			<!-- 内容区域 -->
			<div class="content">
				
			</div>
		 </div>
	</div>
</template>

<script setup lang="ts">
import '../assets/style/index.css'
import { ArrowDownBold, } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
/* 样式已移动到 index.css 中 */
</style>
