const mongoose = require('mongoose');

async function run() {
  console.log('开始为 articles 集合添加 isTop 字段（仅为缺失文档设置为 false）');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/my-blog');
    console.log('✅ MongoDB 连接成功');

    const articlesCol = mongoose.connection.db.collection('articles');

    const result = await articlesCol.updateMany(
      { isTop: { $exists: false } },
      { $set: { isTop: false } }
    );

    console.log(`🔎 匹配文档数量: ${result.matchedCount}`);
    console.log(`✏️ 已修改文档数量: ${result.modifiedCount}`);

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

