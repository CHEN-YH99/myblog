const mongoose = require('mongoose');

async function run() {
  console.log('开始为 articles 集合添加 isTop 字段（仅为缺失文档设置为 false）');
  try {
    // 使用与服务端一致的本地连接（my-blog 数据库）
    await mongoose.connect('mongodb://localhost:27017/my-blog');
    console.log('✅ MongoDB 连接成功');

    const articlesCol = mongoose.connection.db.collection('articles');

    // 仅更新缺少 isTop 字段的文档，避免覆盖已有值
    const result = await articlesCol.updateMany(
      { isTop: { $exists: false } },
      { $set: { isTop: false } }
    );

    console.log(`🔎 匹配文档数量: ${result.matchedCount}`);
    console.log(`✏️ 已修改文档数量: ${result.modifiedCount}`);

    // 简单验证：统计现在包含 isTop 字段的文档数量
    const countWithIsTop = await articlesCol.countDocuments({ isTop: { $exists: true } });
    console.log(`📊 现在包含 isTop 字段的文档总数: ${countWithIsTop}`);
  } catch (err) {
    console.error('❌ 更新失败:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔚 已关闭数据库连接');
  }
}

run();