<template>
  <div class=" timeline">
    <!-- 头部大图 -->
    <div class="timeline_header">
      <div class="large-img">
        <img src="../assets/images/timeline4k.jpg" alt="" />
        <div class="inner-header flex">
          <h1>{{ $route.meta.title }}</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    <!-- 内容 -->
     <div class="timeline_content">
      <el-timeline style="max-width: 600px">
        <el-timeline-item 
          v-for="(item,index) in timelist" :key="index" 
          :timestamp="item.time"
          :hollow="true" 
          center 
          placement="top"
          type="primary"
        >
          <el-card >
            <div class="timeline-card">
              <el-image 
                class="timeline-card-image" 
                style="width: 100px; height: 100px" 
                fit="cover"
              />
              <div class="timeline-card-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.content }}</p>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
     </div>
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs, onMounted} from 'vue'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const timelist = reactive([
  {
    title: 'Update',
    time: '2025',
    content: 'Tom ',
  },
   {
    title: 'Github ',
    time: '2018',
    content: ' committed ',
  },
   {
    title: 'template',
    time: '2014',
    content: '2018/4/12 20:46',
  },
])
  
</script>
<style scoped lang="scss">
.timeline_content {
  margin-top: 2rem;
  box-shadow: 2px 2px 10px 0px #0000001a;
  max-width: 700px;
  margin: 50px auto;
  padding: 1rem;
  border-radius: 10px;
  // background-color: #fff;
  :deep .el-timeline-item__node {
    background-color: rgb(88, 191, 242);
  }
  :deep .el-timeline-item__timestamp {
    font-size: 1.5rem;
    color: rgb(88, 191, 242);
  }
  .timeline-card {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    flex: 1 1 100%;
  }
}
</style>