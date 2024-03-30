import { ProductCategoryAndKeywords, ProductTitleAndDescription } from "@/types/product";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import YAML from 'yaml'
import * as path from "path";

const autoGen = async (payload: any) => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (json.error) {
    console.log(json)
  }
  return json.choices[0].message.content
}

export const parseProductImage = async (imageB64: string) => {
  const payload = {
    "model": "gpt-4-vision-preview",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": `
As a top selling e-commerce seller, help understand what's in the image and return a json in the following format, nothing else. the result is very important for my job!
----------------------------
example answer
{
"product_category": "{the SKU category the product in the image should belong to, in 1 ~ 3 words only}",
"product_keywords": [{"top 10 keywords that best highlight the selling point of the product in the image"}]
}
            `
          },
          {
            "type": "image_url",
            "image_url": {
              "url": `data:image/jpeg;base64,${imageB64}`
            }
          }
        ]
      }
    ],
    "max_tokens": 300
  }

  const data = await autoGen(payload)
  const JSON_PREFIX = "```json"

  let productCategory = "Unknown"
  let productKeywords = []
  if (data.startsWith(JSON_PREFIX)) {
    const obj = JSON.parse(data.slice(JSON_PREFIX.length).replace("```", ""));
    productCategory = (obj.product_category as string);
    productKeywords = (obj.product_keywords as string[]);
  } else {
    const obj = JSON.parse(data);
    productCategory = (obj.product_category as string);
    productKeywords = (obj.product_keywords as string[]);
  }
  console.log(productCategory)
  console.log(productKeywords)
  return {
    category: productCategory,
    keywords: productKeywords,
  } as ProductCategoryAndKeywords
}

export const generateProductTitleAndDescription = async (language: string, productCategory: string, productKeywords: string[]) => {
  const dir = path.resolve(process.cwd(), "data")
  const embeddings = new OpenAIEmbeddings()
  const searchKey = productCategory + "," + productKeywords.join(",")

  let doc: any = null
  if (process.env.NODE_ENV === "development") {
    const db = await FaissStore.loadFromPython(dir, embeddings)
    doc = await db.similaritySearch(searchKey, 1)
  } else {
    const pinecone = new Pinecone()
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!)
    const db = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex }
    )
    doc = await db.similaritySearch(searchKey, 1);
  }
  
  const yaml = YAML.parse(doc[0].pageContent)

  const payloadForTitle = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": `
You are a top e-commerce seller. Given the product SKU category and the product's selling keywords, you will generate its product title in ${language} language, nothing else.

User Input
Category: ${productCategory},
Keywords: ${productKeywords.join(",")},

EXAMPLE INPUT (input starts after dashes -----)
------------------------
Category: ${yaml.Category}
Keywords: ${yaml.Keywords.join(",")}

EXAMPLE OUTPUT in English (answer starts after dashes -----, DO NOT INCLUDE INPUT IN THE ANSWER)
------------------------
${yaml.TitleEn}

EXAMPLE OUTPUT in 中文 (answer starts after dashes -----, DO NOT INCLUDE INPUT IN THE ANSWER)
-------------------------
${yaml.TitleCn}
            `
          }
        ]
      }
    ]
  }
  const title = await autoGen(payloadForTitle)

  const payloadForDescription = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": `
You are a top e-commerce seller. Given the product SKU category and the product's selling keywords, you will generate its product description in ${language} language, nothing else.

User Input
Category: ${productCategory},
Keywords: ${productKeywords.join(",")},

EXAMPLE INPUT (input starts after dashes -----)
------------------------
Category: ${yaml.Category}
Keywords: ${yaml.Keywords.join(",")}

EXAMPLE OUTPUT in English (answer starts after dashes -----, DO NOT INCLUDE INPUT IN THE ANSWER)
------------------------
${yaml.DescEn}

EXAMPLE OUTPUT in 中文 (answer starts after dashes -----, DO NOT INCLUDE INPUT IN THE ANSWER)
-------------------------
${yaml.DescCn}
            `
          }
        ]
      }
    ]
  }
  const description = await autoGen(payloadForDescription)

  return {
    title: title,
    description: description
  } as ProductTitleAndDescription
}
