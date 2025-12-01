<template>
  <div class="photo-album-wrapper">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/kahs.jpeg" alt="相册页面头图" />
        <div class="inner-header flex">
          <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">相册</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    <!-- 内容 -->
    <!-- 使用 visiblePhotoCategories：已过滤出可展示分类 -->
    <div
      v-if="visiblePhotoCategories.length"
      class="timeline_content animate__animated animate__fadeInUp"
    >
      <!-- 标签栏 -->
      <div class="tags-info">
        <section class="tag-cloud">
          <ul>
            <li v-for="item in visiblePhotoCategories" :key="(item._id || item.id) + '-' + buildCategoryVersion(item)">
              <router-link
                :to="'/photo-category/' + (item._id || item.id)"
                class="photo-link"
              >
                <div class="image-container">
                  <img :src="getCoverUrl(item.coverImage, buildCategoryVersion(item))" :alt="item.title" />
                  <div class="overlay">
                    <span class="title">{{ item.title }}</span>
                    <span class="content">{{ item.description }}</span>
                  </div>
                </div>
              </router-link>
            </li>
          </ul>
        </section>
      </div>
    </div>
    <div v-else class="empty">
      <el-empty description="暂无相册分类" :image-size="200" />
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, onUnmounted, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import { usePhotoCategories } from '@/composables/usePhotoCategories' // 引入图片分类数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const { photoCategories, initPhotoCategories } = usePhotoCategories()

// 根据分类的更新时间构建一个版本号用于 key 和图片缓存破除
const buildCategoryVersion = (item: any) => {
  const src = item?.updatedAt || item?.updateTime || item?.createdAt || item?.createTime || ''
  try {
    const d = new Date(src)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch {}
  // 退化到与内容相关的字段，尽量保证变更后 key 改变
  return String(src || item?.title || item?.name || item?._id || '')
}

// 根据 updatedAt 追加版本号，避免封面图浏览器缓存导致看不到更新
const getCoverUrl = (imageUrl?: string, version?: string | Date) => {
  if (!imageUrl) return ''
  let finalUrl = imageUrl
  if (version) {
    let v: string
    try {
      v = typeof version === 'string' ? version : new Date(version).toISOString()
    } catch {
      v = String(version)
    }
    const sep = finalUrl.includes('?') ? '&' : '?'
    finalUrl += `${sep}v=${encodeURIComponent(v)}`
  }
  return finalUrl
}

// 分类显示/隐藏逻辑：禁用或不可见则隐藏
// - 若后端返回 status = 'inactive'，视为禁用
// - 若前端数据含 isVisible = false，同样视为禁用
// - 仅当两者都不表示禁用时，分类可见
const isPhotoCategoryVisible = (item: any): boolean => {
  const disabledByStatus = item?.status === 'inactive'
  const disabledByVisible = item?.isVisible === false
  return !(disabledByStatus || disabledByVisible)
}

// 已过滤的分类列表（仅展示可见分类）
const visiblePhotoCategories = computed(() =>
  photoCategories.value.filter(isPhotoCategoryVisible),
)

// 组件挂载时初始化数据
onMounted(async () => {
  // dev log: 组件挂载，开始初始化数据
  try {
    // 强制刷新，确保管理端更新后用户端立即可见
    await initPhotoCategories(undefined, { force: true })
    if ((import.meta as any)?.env?.DEV) console.log('PhotoAlbum.vue - 相册分类初始化完成(强制刷新)')
  } catch (err) {
    console.error('PhotoAlbum.vue - 初始化数据失败:', err)
    ElMessage.error('初始化数据失败，请刷新页面重试')
  }

  // 监听页面可见性变化，页面回到前台时强制刷新一次
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      try {
        await initPhotoCategories(undefined, { force: true })
      } catch (e) {
        console.warn('PhotoAlbum.vue - 可见性切换刷新失败:', e)
      }
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 在组件卸载时移除监听
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
})

// 当页面从缓存中激活时，强制刷新一次，避免在 KeepAlive 场景下看不到管理端的最新修改
onActivated(async () => {
  try {
    await initPhotoCategories(undefined, { force: true })
  } catch (e) {
    console.warn('PhotoAlbum.vue - onActivated 刷新失败:', e)
  }
})

// 组件卸载时清理
// cleanup函数在组件卸载时调用，但usePhotoCategories没有cleanup函数，所以只清理articles
</script>

<style scoped lang="scss">
.tags-info {
  .tag-cloud {
    width: 60%;
    margin: 100px auto 200px auto;
    box-shadow: 2px 2px 10px #ccc;
    ul {
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 8px; // 添加元素间距
      padding: 5px; // 添加内边距
      li {
        transition: all 0.3s ease-in-out;
        list-style-type: none;
        flex: 0 0 calc(25% - 6px); // 每行4个元素，减去gap的影响
        &:hover {
          transform: translateY(-3px);
          .image-container {
            img {
              filter: saturate(3); // 饱和度增加
            }

            .overlay {
              background-color: rgba(0, 0, 0, 0.4); // 背景变深
            }
          }
        }
        .image-container {
          position: relative;
          img {
            transition: filter 0.3s ease-in-out;
            width: 100%;
            height: 160px;
            object-fit: cover;
            border-radius: 10px;
          }
          .overlay {
            transition: background-color 0.3s ease-in-out;
            position: absolute;
            top: 10px;
            left: 0;
            right: 0;
            margin: 0 auto;
            width: 80%;
            background-color: rgba(0, 0, 0, 0.2);
            color: white;
            font-weight: bolder;
            padding: 10px;
            border-radius: 10px;
            .title {
              display: block;
              text-align: left;
              font-size: 16px;
            }
            .content {
              display: block;
              text-align: left;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}

// 响应式媒体查询
// 大屏幕 (1200px以上) - 保持4列
@media (min-width: 1200px) {
  .tags-info .tag-cloud {
    width: 60%;
    ul li {
      flex: 0 0 calc(25% - 6px); // 4列
    }
  }
}

// 中等屏幕 (768px - 1199px) - 3列
@media (max-width: 1199px) and (min-width: 768px) {
  .tags-info .tag-cloud {
    width: 85%;
    ul li {
      flex: 0 0 calc(33.333% - 6px); // 3列
    }
  }
}

// 小屏幕 (480px - 767px) - 2列
@media (max-width: 767px) and (min-width: 480px) {
  .tags-info .tag-cloud {
    width: 90%;
    margin: 50px auto 100px auto;
    ul {
      gap: 10px;
      padding: 10px;
      li {
        flex: 0 0 calc(50% - 5px); // 2列
        .image-container img {
          height: 140px; // 稍微调小图片高度
        }
      }
    }
  }
}

// 超小屏幕 (480px以下) - 1列
@media (max-width: 479px) {
  .tags-info .tag-cloud {
    width: 95%;
    margin: 30px auto 80px auto;
    ul {
      gap: 15px;
      padding: 15px;
      li {
        flex: 0 0 100%; // 1列，占满宽度
        .image-container img {
          height: 200px; // 单列时图片可以高一些
        }
        .overlay {
          width: 90%; // 单列时文字覆盖层可以更宽
        }
      }
    }
  }
}
</style>
