import { z } from 'zod';
import { procedure, router } from '../trpc';
import { ProductCategoryAndKeywords, ProductTitleAndDescription } from '@/types/product';
import { generateProductTitleAndDescription as genViaOpenAi, parseProductImage } from '../openai';
import { generateProductTitleAndDescription as genViaJarvisWebEmc } from '../jarvisbot-web'
import { generateProductTitleAndDescription as genViaJarvisSdkEmc } from '../jarvisbot-sdk'

export const appRouter = router({
  parseProductImage: procedure
    .input(
      z.object({
        imageB64: z.string(),
      }),
    )
    .mutation(async (opts) => {
      if (opts.input.imageB64) {
        return await parseProductImage(opts.input.imageB64)
      }
      return {
        category: "Unknown",
        keywords: [],
      } as ProductCategoryAndKeywords
    }),

  generateTitleAndDescription: procedure
    .input(
      z.object({
        language: z.string(),
        category: z.string(),
        keywords: z.array(z.string()),
      }),
    )
    .query(async (opts) => {
      const productCategory = opts.input.category;
      const productKeywords = opts.input.keywords;
      if (productCategory && productKeywords.length > 0) {
        if (process.env.CHAT_IMPL === "jarvisbot-web") {
          return await genViaJarvisWebEmc(opts.input.language, productCategory, productKeywords)
        } else if (process.env.CHAT_IMPL === "jarvisbot-sdk") {
          return await genViaJarvisSdkEmc(opts.input.language, productCategory, productKeywords)
        } else {
          return await genViaOpenAi(opts.input.language, productCategory, productKeywords)
        }
      } else {
        return {
          title: "Unknown", 
          description: "",
        } as ProductTitleAndDescription
      }
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;