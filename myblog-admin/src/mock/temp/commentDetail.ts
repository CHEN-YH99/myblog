// 评论详情模拟数据
export interface Comment {
  id: string
  author: string
  avatar?: string
  content: string
  createTime: string
  likes: number
  replies?: Comment[]
}

export const commentList: Comment[] = [
  {
    id: '1',
    author: '张三',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '这篇文章写得很好，学到了很多东西！',
    createTime: '2024-01-15 10:30:00',
    likes: 12,
    replies: [
      {
        id: '1-1',
        author: '李四',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        content: '同感，作者写得很详细',
        createTime: '2024-01-15 11:00:00',
        likes: 3
      }
    ]
  },
  {
    id: '2',
    author: '王五',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '期待更多这样的技术分享',
    createTime: '2024-01-15 14:20:00',
    likes: 8
  },
  {
    id: '3',
    author: '赵六',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '代码示例很清晰，容易理解',
    createTime: '2024-01-15 16:45:00',
    likes: 15
  }
]