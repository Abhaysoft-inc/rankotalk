import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    published: z.string(),
    updated: z.string(),
    order: z.number(),
  }),
});

export const collections = { guides };
