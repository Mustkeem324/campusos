export * from './content-core';

import type { BlogPost } from './content-core';
import { STARTER_BLOG_POSTS_1 } from './starter-posts-1';
import { STARTER_BLOG_POSTS_2 } from './starter-posts-2';
import { STARTER_BLOG_POSTS_3 } from './starter-posts-3';
import { STARTER_BLOG_POSTS_4 } from './starter-posts-4';

export const STARTER_BLOG_POSTS: BlogPost[] = [
  ...STARTER_BLOG_POSTS_1,
  ...STARTER_BLOG_POSTS_2,
  ...STARTER_BLOG_POSTS_3,
  ...STARTER_BLOG_POSTS_4,
];
