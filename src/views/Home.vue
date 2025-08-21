<template>
	<div class="home-page">
		<nav class="navbar" 
			:class="{
				'navbar-scrolled': isScrolled, 
				'navbar-hidden': isHidden 
			}"
		>
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
		</nav>
		<!-- 主要内容区域 -->
		<div class="main-content">
			<!-- 回到顶部 -->
			<el-backtop :right="100" :bottom="100" />
			<el-row>
				<!-- 内容区域 -->
				<div class="content-list flex">
					<el-col :span = '18'>
						<!-- 左侧文章卡片 -->
						<div class="article-card">
							<div class="card-image">
								<el-image style="width: 100%; height: 100%;" :src="url" :fit="fit"/>
							</div>
							<div class="card-content">
								<h3 class="article-title">博客部署教程-宝塔面板</h3>
								<div class="article-meta">
									<span class="meta-item">📌 置顶</span>
									<span class="meta-item">📅 发表于 2023-05-19 19:47:44</span>
									<span class="meta-item">🔄 更新于 2025-06-15 14:51:40</span>
								</div>
								<div class="article-tags">
									<span class="tag">博客部署</span>
									<span class="tag">linux</span>
									<span class="tag">阿里云轻量服务器</span>
									<span class="tag">宝塔面板</span>
								</div>
								<div class="article-stats">
									<span>👍 116</span>
									<span>👁 1.5w</span>
								</div>
								<p class="article-excerpt">这篇文章是在第一篇普通教程的基础上，使用宝塔面板...</p>
							</div>
						</div>
						<div class="article-card">
							<div class="card-content">
								<h3 class="article-title">博客部署教程-宝塔面板</h3>
								<div class="article-meta">
									<span class="meta-item">📌 置顶</span>
									<span class="meta-item">📅 发表于 2023-05-19 19:47:44</span>
									<span class="meta-item">🔄 更新于 2025-06-15 14:51:40</span>
								</div>
								<div class="article-tags">
									<span class="tag">博客部署</span>
									<span class="tag">linux</span>
									<span class="tag">阿里云轻量服务器</span>
									<span class="tag">宝塔面板</span>
								</div>
								<div class="article-stats">
									<span>👍 116</span>
									<span>👁 1.5w</span>
								</div>
								<p class="article-excerpt">这篇文章是在第一篇普通教程的基础上，使用宝塔面板...</p>
							</div>
							<div class="card-image">
								<el-image style="width: 100%; height: 100%;" :src="url" :fit="fit"/>
							</div>
						</div>
					</el-col>

					<el-col :span = '6'>
						<!-- 右侧个人信息 -->
						<div class="about-me">
							<el-image :src="url" :fit="fit"/>
							<el-avatar class="avatar" shape="circle" size="large" :src="url" />
							<h5>小灰的个人博客</h5>
							<div class="pub about-me-content">
								<p>👋 写出<i>HelloWord你就可以拿高薪了</i></p>
							</div>
							<div class="pub my-data">
								<div class="pub-item">
									<p>📖 文章116</p>
								</div>
								<div class="pub-item">
									<p>👍 点赞量116</p>
								</div>
								<div class="pub-item">
									<p>🎉 阅读量1.5w</p>
								</div>
							</div>
							<div class="my-tags">
								<button class="custom-gitee-btn">
									<el-icon class="icon" size="18">
										<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
											<path fill="currentColor" d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"/>
										</svg>
									</el-icon>
									My Gitee
								</button>
							</div>
							<div class="my-links">
								<img src="../assets/images/csdn.svg"/>
								<img src="../assets/images/github.svg"/>
								<img src="../assets/images/哔哩哔哩.svg"/>
							</div>
						</div>
					</el-col>
				</div>	
			</el-row>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted, onBeforeUnmount} from 'vue'
	import { ArrowDownBold, } from '@element-plus/icons-vue'

	import '../assets/style/index.css'
	import bgImage from '../assets/images/shunsea1.jpg'  // 图片地址 - 正确的静态资源引用方式
	const url = ref(bgImage)
	const fit = ref('cover')

	// 滚动事件
	const isScrolled = ref(false)  // 是否滚动的标志
	const isHidden = ref(false)  // 是否隐藏的标志
	const lastScrollTop = ref(0)  // 记录上一次滚动位置
	const scrollTimeout = ref(null) // 防抖
	// 监听滚动事件
	const handleScroll = () => {
		
	  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
		// const scrollPosition = document.body.scrollTop || 0;
	  console.log("滚动条距离顶部位置:", scrollPosition)
		
		
    if (scrollPosition > lastScrollTop.value) {
      isScrolled.value = true
			
			
			setTimeout(() => {
				isHidden.value = true
			}, 300)
    } else {
      isHidden.value = false
			console.log("isScrolled", isHidden.value);
		  setTimeout(() => {
				isScrolled.value = false
			}, 300)
    }
	}
	// 组件挂载时，监听滚动事件
	onMounted(() => {
  // window.addEventListener('scroll', handleScroll, { passive: true })
  
  document.body.addEventListener('scroll', handleScroll, { passive: true })
})
// 记得在组件卸载时移除监听器
onBeforeUnmount(() => {
  document.body.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
/* 样式已移动到 index.css 中 */
</style>
