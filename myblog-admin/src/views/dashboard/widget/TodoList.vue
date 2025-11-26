<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">{{ $t('dashboard.todoList.title') }}</h4>
        <p class="subtitle">{{ $t('dashboard.todoList.pending') }}<span class="text-danger">3</span></p>
      </div>
    </div>

    <div class="list">
      <div v-for="(item, index) in list" :key="index">
        <p class="title">{{ $t(item.titleKey) }}</p>
        <p class="date subtitle">{{ $t(item.timeKey) }}</p>
        <el-checkbox v-model="item.complate" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue-demi'

  const list = reactive([
    {
      titleKey: 'dashboard.todoList.items.viewTodayWork',
      timeKey: 'dashboard.todoList.time.morning_0930',
      complate: true
    },
    {
      titleKey: 'dashboard.todoList.items.replyEmails',
      timeKey: 'dashboard.todoList.time.morning_1030',
      complate: true
    },
    {
      titleKey: 'dashboard.todoList.items.reportPreparation',
      timeKey: 'dashboard.todoList.time.morning_1100',
      complate: true
    },
    {
      titleKey: 'dashboard.todoList.items.productMeeting',
      timeKey: 'dashboard.todoList.time.afternoon_0200',
      complate: false
    },
    {
      titleKey: 'dashboard.todoList.items.organizeMeetingNotes',
      timeKey: 'dashboard.todoList.time.afternoon_0330',
      complate: false
    },
    {
      titleKey: 'dashboard.todoList.items.tomorrowPlan',
      timeKey: 'dashboard.todoList.time.afternoon_0630',
      complate: false
    }
  ])
</script>

<style lang="scss" scoped>
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 510px;
    padding: 0 25px;

    .list {
      height: calc(100% - 90px);
      margin-top: 10px;
      overflow: hidden;

      > div {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 70px;
        overflow: hidden;
        border-bottom: 1px solid var(--art-border-color);

        p {
          font-size: 13px;
        }

        .title {
          font-size: 14px;
        }

        .date {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 400;
        }

        .el-checkbox {
          position: absolute;
          top: 0;
          right: 10px;
          bottom: 0;
          margin: auto;
        }
      }
    }
  }
</style>
