
// export interface Article {
//   _id: string;
//   title: string;
//   content: string;
//   author: string;
//   tags?: string[];
//   publishDate: string;
//   updateDate: string;
//   likes: number;
//   views: number;
//   excerpt: string;
//   image: string; 
// }


// const API_BASE_URL = 'http://localhost:3001/api';

// export class ArticleService {
//   /**
//    * 获取所有文章的静态异步方法
//    * @returns {Promise<Article[]>} 返回一个包含所有文章的Promise对象
//    * @throws {Error} 当网络请求失败时抛出错误
//    */
//   static async getAllArticles(): Promise<Article[]> {
//     try {
//       // 发起GET请求获取所有文章
//       const response = await fetch(`${API_BASE_URL}/articles`);
//       // 检查响应状态是否成功
//       if (!response.ok) {
//         throw new Error('网络请求失败');
//       }
//       // 解析并返回JSON格式的响应数据
//       return await response.json();
//     } catch (error) {
//       // 在控制台打印错误信息
//       console.error('获取文章失败:', error);
//       // 将错误向上抛出
//       throw error;
//     }
//   }

//   /**
//    * 通过文章ID获取文章详情的异步方法
//    * @param id - 文章的唯一标识符
//    * @returns Promise<Article> - 返回一个包含文章信息的Promise对象
//    */
//   static async getArticleById(id: string): Promise<Article> {
//     try {
//       // 发起GET请求获取指定ID的文章
//       const response = await fetch(`${API_BASE_URL}/articles/${id}`);
//       // 检查响应状态是否成功
//       if (!response.ok) {
//         throw new Error('网络请求失败');
//       }
//       // 解析并返回JSON格式的文章数据
//       return await response.json();
//     } catch (error) {
//       // 捕获并处理可能发生的错误
//       console.error('获取文章失败:', error);
//       // 向上抛出错误以便调用方处理
//       throw error;
//     }
//   }
// }


// src/api/articles.ts
export interface TocItem {
  id: string
  text: string
  level: number
}

export interface Article {
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

const API_BASE_URL = 'http://localhost:3001/api'

export class ArticleService {
  static async getAllArticles(params?: { tag?: string; category?: string }): Promise<Article[]> {
    const u = new URL(`${API_BASE_URL}/articles`)
    if (params?.tag) u.searchParams.set('tag', params.tag)
    if (params?.category) u.searchParams.set('category', params.category)
    const res = await fetch(u)
    if (!res.ok) throw new Error('获取文章列表失败')
    return res.json()
  }

  static async getArticle(idOrSlug: string): Promise<Article> {
    const res = await fetch(`${API_BASE_URL}/articles/${idOrSlug}`)
    if (!res.ok) throw new Error('获取文章失败')
    return res.json()
  }

  static async createArticle(payload: Partial<Article>): Promise<Article> {
    const res = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('创建文章失败')
    return res.json()
  }

  static async uploadImage(file: File): Promise<{ url: string }> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE_URL}/uploads`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('上传失败')
    return res.json()
  }
}
