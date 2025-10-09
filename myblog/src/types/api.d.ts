/**
 * API相关类型定义
 */
declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current?: number
      /** 每页条数 */
      size?: number
      /** 偏移量 */
      offset?: number
      /** 限制数量 */
      limit?: number
    }
    /** 通用搜索参数 */
    interface SearchParams extends PaginationParams {
      /** 搜索关键词 */
      keyword?: string
      /** 排序字段 */
      sortBy?: string
      /** 排序方向 */
      sortOrder?: 'asc' | 'desc'
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2' // 1: 启用 2: 禁用

    /** 通用ID参数 */
    interface IdParams {
      id: string
    }
  }
  /** 说说相关类型 */
  namespace Talk {
    /** 说说项 */
    interface TalkItem {
      _id: string
      content: string
      images?: string[]
      isTop?: boolean
      isHidden?: boolean
      status: number // 1: 公开 2: 私密
      publishDate: string
      createdAt: string
      updatedAt: string
      likes?: number // 点赞数
      views?: number // 浏览数
    }

    /** 说说列表 */
    interface TalkList {
      records: TalkItem[]
      total: number
      current: number
      size: number
    }

    /** 说说搜索参数 */
    interface SearchParams extends Common.SearchParams {
      status?: string
      isTop?: boolean
      isHidden?: boolean
    }
  }

  /** 回复相关类型 */
  namespace Reply {
    /** 回复项 */
    interface ReplyItem {
      _id: string
      talkId: string
      content: string
      author: string
      email?: string
      website?: string
      avatar?: string
      ip?: string
      location?: string
      parentId?: string
      replyTo?: string
      publishDate: string
      status: 'approved' | 'pending' | 'rejected'
      likes: number
      isDeleted: boolean
      children?: ReplyItem[] // 子回复
    }

    /** 回复列表 */
    interface ReplyList {
      records: ReplyItem[]
      total: number
      current: number
      size: number
    }

    /** 添加回复参数 */
    interface AddReplyParams {
      content: string
      author: string
      email?: string
      website?: string
      parentId?: string
      replyTo?: string
    }
  }

  /** 文章相关类型 */
  namespace Article {
    /** 目录项 */
    interface TocItem {
      id: string
      text: string
      level: number
    }

    /** 文章项 */
    interface ArticleItem {
      _id: string
      title: string
      slug: string
      content: string
      contentFormat: 'markdown' | 'html'
      contentHtml?: string
      toc?: TocItem[]
      author: string
      category?: string
      tags?: string[]
      publishDate: string
      updateDate: string
      likes: number
      views: number
      excerpt: string
      image?: string
    }

    /** 文章列表 */
    type ArticleList = ArticleItem[]

    /** 文章搜索参数 */
    interface SearchParams extends Api.Common.SearchParams {
      /** 标签 */
      tag?: string
      /** 分类 */
      category?: string
      /** 作者 */
      author?: string
      /** 开始日期 */
      startDate?: string
      /** 结束日期 */
      endDate?: string
      /** 年份 */
      year?: string
      /** 页码 */
      page?: number
      /** 每页数量 */
      size?: number
    }

    /** 创建文章参数 */
    interface CreateParams {
      title: string
      slug?: string
      content: string
      contentFormat?: 'markdown' | 'html'
      contentHtml?: string
      toc?: TocItem[]
      author: string
      category?: string
      tags?: string[]
      excerpt?: string
      image?: string
    }

    /** 更新文章参数 */
    interface UpdateParams extends Partial<CreateParams> {
      updateDate?: string
    }

    /** 点赞响应 */
    interface LikeResponse {
      likes: number
    }

    /** 点赞状态响应 */
    interface LikeStatusResponse {
      isLiked: boolean
    }

    /** 批量点赞状态响应 */
    interface BatchLikeStatusResponse {
      [articleId: string]: boolean
    }

    /** 点赞数响应 */
    interface LikeCountResponse {
      likes: number
    }

    /** 浏览量响应 */
    interface ViewsResponse {
      views: number
    }

    /** 上传响应 */
    interface UploadResponse {
      url: string
      filename?: string
      size?: number
    }

    /** 搜索响应 */
    interface SearchResponse {
      articles: ArticleItem[]
      total: number
      keyword: string
    }

    /** 搜索建议项 */
    interface SuggestionItem {
      text: string
      type: 'title' | 'tag' | 'category'
    }

    /** 分类项 */
    interface CategoryItem {
      _id?: string
      id?: string
      name: string
      slug: string
      description?: string
      color?: string
      sort?: number
      status: 'active' | 'inactive'
      articleCount?: number
      createTime?: string
      updateTime?: string
    }

    /** 标签项 */
    interface TagItem {
      name: string
      count: number
    }

    /** 分类搜索参数 */
    interface CategorySearchParams {
      page?: number
      size?: number
      keyword?: string
      status?: 'active' | 'inactive'
    }

    /** 创建分类参数 */
    interface CreateCategoryParams {
      name: string
      slug: string
      description?: string
      color?: string
      sort?: number
      status?: 'active' | 'inactive'
    }

    /** 更新分类参数 */
    interface UpdateCategoryParams extends Partial<CreateCategoryParams> {
      _id?: string
    }

    /** 分类列表响应 */
    interface CategoryListResponse {
      categories: CategoryItem[]
      total: number
      currentPage: number
      pageSize: number
    }
  }

  /** 图片分类相关类型 */
  namespace PhotoCategory {
    /** 图片分类项 */
    interface PhotoCategoryItem {
      _id: string
      id: string
      name: string
      title: string
      description: string
      coverImage: string
      photoCount: number
      sortOrder: number
      isVisible: boolean
      createdAt: string
      updatedAt: string
    }

    /** 图片分类列表 */
    type PhotoCategoryList = PhotoCategoryItem[]

    /** 图片分类搜索参数 */
    interface SearchParams extends Api.Common.SearchParams {
      /** 搜索关键词 */
      keyword?: string
      /** 是否可见 */
      isVisible?: boolean
    }

    /** 图片分类列表响应 */
    interface ListResponse {
      categories: PhotoCategoryItem[]
      total: number
      currentPage: number
      pageSize: number
    }

    /** 图片分类详情响应 */
    interface DetailResponse extends PhotoCategoryItem {}
  }

  /** 图片相关类型 */
  namespace Photo {
    /** 图片项 */
    interface PhotoItem {
      _id: string
      categoryId: string
      title: string
      description: string
      imageUrl: string
      thumbnailUrl: string
      tags: string[]
      uploadDate: string
      sortOrder: number
      isVisible: boolean
      viewCount: number
      likeCount: number
    }

    /** 图片列表 */
    type PhotoList = PhotoItem[]

    /** 图片搜索参数 */
    interface SearchParams extends Api.Common.SearchParams {
      /** 分类ID */
      categoryId?: string
      /** 搜索关键词 */
      keyword?: string
      /** 标签 */
      tag?: string
      /** 是否可见 */
      isVisible?: boolean
    }

    /** 图片列表响应 */
    interface ListResponse {
      photos: PhotoItem[]
      total: number
      currentPage: number
      pageSize: number
    }

    /** 图片详情响应 */
    interface DetailResponse extends PhotoItem {}
  }

  /** 用户相关类型 */
  namespace User {
    /** 用户信息 */
    interface UserInfo {
      id: string
      username: string
      email: string
      avatar?: string
      nickname?: string
      bio?: string
      createTime: string
      updateTime: string
    }

    /** 登录参数 */
    interface LoginParams {
      username: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      userInfo: UserInfo
    }

    /** 注册参数 */
    interface RegisterParams {
      username: string
      email: string
      password: string
      confirmPassword: string
    }
  }

  /** 评论相关类型 */
  namespace Comment {
    /** 评论项 */
    interface CommentItem {
      id: string
      articleId: string
      content: string
      author: string
      email?: string
      website?: string
      createTime: string
      likes: number
      parentId?: string
      replies?: CommentItem[]
    }

    /** 创建评论参数 */
    interface CreateParams {
      articleId: string
      content: string
      author: string
      email?: string
      website?: string
      parentId?: string
    }
  }

}