<template>
	<div class="home-page">
		<div class="header">
			<div class="inner-header flex">
				<h1>小灰个人博客</h1>
			</div>
			<el-icon color="#ffffff" size="30px" class="turndown"><arrow-down-bold /></el-icon>

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
		
		<!-- 主要内容区域 -->
		<div class="main-content">
			<!-- 回到顶部 -->
			<el-backtop :right="100" :bottom="100" />
			
			<!-- 内容区域 -->
			<div class="content-list">
				<el-row>
					<el-col
						v-for="(o, index) in 2"
						:key="o"
						:span="8"
						:offset="index > 0 ? 2 : 0"
					>
						<el-card :body-style="{ padding: '0px' }">
							<img
								src="https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
								class="image"
							/>
							<div style="padding: 14px">
								<span>汉堡</span>
								<div class="bottom">
									<time class="time">{{ currentDate }}</time>
									<el-button type="text" class="button">操作</el-button>
								</div>
							</div>
						</el-card>
					</el-col>
				</el-row>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import '../assets/style/index.css'
import { ArrowDownBold, } from '@element-plus/icons-vue'

const currentDate = ref(new Date())
</script>

<style scoped lang="scss">
/* 样式已移动到 index.css 中 */
</style>
