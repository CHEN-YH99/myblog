# 相册分类详情页图片加载问题修复

## 问题描述
进入图片详情页（PhotoCategoryDetail.vue）时，没有展示该分类下的图片。

## 根本原因分析

### 1. **响应格式不匹配**
- **后端返回格式**：`{ code, msg, data: { records, total, current, size } }`
- **前端期望格式**：`{ photos, total, currentPage, pageSize }`
- HTTP Client 返回 `data` 字段内容，所以前端收到的是 `{ records, total, current, size }`
- `usePhotos.ts` 中直接访问 `response.photos` 导致 `undefined`，最终 `photos.value` 为空

### 2. **分页参数未重置**
- 切换分类时，分页信息（`pagination.current`）未重置
- 可能导致查询参数不正确

### 3. **旧数据未清空**
- 进入新分类前，旧分类的照片数据未清空
- 虽然查询失败，但旧数据仍然显示

## 修复方案

### 修复 1: `src/composables/usePhotos.ts`

**问题**：响应格式不匹配，且分页未重置

**解决**：
```typescript
const initPhotos = async (params?: Api.Photo.SearchParams) => {
  loading.value = true
  error.value = null

  try {
    // ✅ 重置分页到第1页
    pagination.current = 1
    
    const response = await getPhotos({
      current: pagination.current,
      size: pagination.size,
      ...params,
    })

    // ✅ 兼容后端响应格式：records/current/size 或 photos/currentPage/pageSize
    const photoList = (response as any).records || (response as any).photos || []
    const currentPage = (response as any).current || (response as any).currentPage || 1
    const pageSize = (response as any).size || (response as any).pageSize || 20

    photos.value = photoList
    pagination.total = response.total || 0
    pagination.current = currentPage
    pagination.size = pageSize

    console.log(`获取照片列表成功: ${photoList.length} 张, 总数: ${pagination.total}`)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '获取照片列表失败'
    console.error('获取照片列表失败:', err)
    // ✅ 错误时清空照片列表
    photos.value = []
  } finally {
    loading.value = false
  }
}
```

**关键改动**：
- 添加 `pagination.current = 1` 重置分页
- 兼容处理 `records/current/size` 和 `photos/currentPage/pageSize` 两种格式
- 错误时清空 `photos.value`
- 添加调试日志

### 修复 2: `src/views/PhotoCategoryDetail.vue`

**问题**：进入新分类时未清空旧数据

**解决**：
```typescript
const fetchCategoryAndPhotos = async (id: string) => {
  if (!id || isRefreshing) return
  isRefreshing = true
  try {
    // ✅ 先清空旧的照片数据
    photos.value = []
    console.log(`[PhotoCategoryDetail] 开始加载分类: ${id}`)
    
    // 获取分类详情
    const detail = await getPhotoCategoryDetail(id)
    if (detail) {
      currentCategory.value = detail as Api.PhotoCategory.PhotoCategoryItem
      console.log(`[PhotoCategoryDetail] 获取分类详情成功:`, currentCategory.value)
    }

    // 检查分类是否被禁用
    const c: any = currentCategory.value
    if (c && (c.status === 'inactive' || c.isVisible === false)) {
      console.log(`[PhotoCategoryDetail] 分类已禁用，不加载照片`)
      photos.value = []
      return
    }

    // 计算用于查询照片列表的分类ID
    const fetchCategoryId = currentCategory.value?.id || currentCategory.value?._id || id
    console.log(`[PhotoCategoryDetail] 使用分类ID查询照片: ${fetchCategoryId}`)
    await initPhotos({ categoryId: fetchCategoryId, isVisible: true })

    console.log(`[PhotoCategoryDetail] 第一次查询获得 ${photos.value.length} 张照片`)

    // 如果按 id 查询没有数据，回退用 _id 再查一次
    if (
      photos.value.length === 0 &&
      currentCategory.value?._id &&
      currentCategory.value._id !== fetchCategoryId
    ) {
      console.log(`[PhotoCategoryDetail] 第一次查询无结果，回退用 _id 查询: ${currentCategory.value._id}`)
      await initPhotos({
        categoryId: currentCategory.value._id,
        isVisible: true,
      })
      console.log(`[PhotoCategoryDetail] 第二次查询获得 ${photos.value.length} 张照片`)
    }
  } catch (e) {
    console.warn('[PhotoCategoryDetail] 刷新分类与照片数据失败: ', e)
    // ✅ 出错时也清空照片列表
    photos.value = []
  } finally {
    isRefreshing = false
  }
}
```

**关键改动**：
- 在函数开始时清空 `photos.value = []`
- 添加详细的调试日志
- 出错时也清空照片列表
- 支持 `id` 和 `_id` 两种查询方式的回退机制

## 验证步骤

1. **打开浏览器开发者工具**（F12）
2. **进入相册页面**，点击任意分类
3. **查看控制台日志**，确认：
   - `[PhotoCategoryDetail] 开始加载分类: xxx`
   - `[PhotoCategoryDetail] 获取分类详情成功: {...}`
   - `[PhotoCategoryDetail] 使用分类ID查询照片: xxx`
   - `获取照片列表成功: N 张, 总数: M`
4. **检查页面**，确认图片正常显示
5. **在分类间切换**，确认不会短暂显示上一个分类的图片

## 后端 API 参考

### GET /api/photos
**请求参数**：
- `categoryId`: 分类ID（支持 `id` 或 `_id`）
- `current`: 当前页码（默认 1）
- `size`: 每页条数（默认 20）
- `isVisible`: 是否可见（默认 true）

**响应格式**：
```json
{
  "code": 200,
  "msg": "获取照片列表成功",
  "data": {
    "records": [...],
    "total": 10,
    "current": 1,
    "size": 20
  }
}
```

### GET /api/photo-categories/:id
**响应格式**：
```json
{
  "code": 200,
  "msg": "获取照片分类成功",
  "data": {
    "_id": "...",
    "id": "...",
    "name": "...",
    "title": "...",
    "description": "...",
    "coverImage": "...",
    "photoCount": 10,
    "sortOrder": 0,
    "isVisible": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 可能的后续问题

如果修复后仍然无法显示图片，请检查：

1. **后端数据**：确认数据库中该分类下有照片
   ```bash
   # MongoDB 查询
   db.photos.find({ categoryId: "xxx" })
   ```

2. **网络请求**：在浏览器开发者工具的 Network 标签中检查：
   - `/api/photo-categories/:id` 是否返回正确的分类信息
   - `/api/photos?categoryId=xxx` 是否返回照片列表
   - 响应状态码是否为 200
   - 响应体中的 `data.records` 是否有数据

3. **分类 ID 格式**：确认：
   - 分类 ID 是否正确传递
   - 照片的 `categoryId` 是否与分类 ID 匹配
   - 是否存在 `id` 和 `_id` 不一致的问题

4. **权限问题**：确认：
   - 用户是否已登录（相册需要登录访问）
   - 分类 `isVisible` 是否为 `true`
   - 照片 `isVisible` 是否为 `true`

## 修改文件清单

- ✅ `myblog/src/composables/usePhotos.ts` - 修复响应格式兼容性和分页重置
- ✅ `myblog/src/views/PhotoCategoryDetail.vue` - 清空旧数据和添加调试日志

