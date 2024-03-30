import { ProductCategoryAndKeywords, ProductTitleAndDescription } from "@/types/product";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import YAML from 'yaml'
import * as path from "path";

const innerAutoGen = async (payload: string) => {
  const chat_params = {
    "messages": [
      {
        "role": "user",
        "content": payload
      }
    ]
  }
  console.log(JSON.stringify(chat_params))
  const res = await fetch("http://jarvisbot.emchub.ai:10013/jarvis/v1/token/proxy_llm/llmapi_v1_chat_completions", {
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "App-token": `${process.env.JARVISBOT_SDK_TOKEN}`,
    },
    body: JSON.stringify(chat_params),
  })
  const json = await res.json()
  console.log(json)
  console.log(JSON.stringify(json.choices[0].message))
  return json.choices[0].message.content
}

const autoGen = async (payload: string) => {
  try {
    return await innerAutoGen(payload)
  } catch (e: any) {
    console.log(e.message)
    return "Unknown"
  }
}

export const generateProductTitleAndDescription = async (language: string, productCategory: string, productKeywords: string[]) => {
  // TODO: more RAG work when Jarvis is capable of handling it

  // const dir = path.resolve(process.cwd(), "data")
  // const embeddings = new OpenAIEmbeddings()
  // const searchKey = productCategory + "," + productKeywords.join(",")

  // let doc: any = null
  // if (process.env.NODE_ENV === "development") {
  //   const db = await FaissStore.loadFromPython(dir, embeddings)
  //   doc = await db.similaritySearch(searchKey, 1)
  // } else {
  //   const pinecone = new Pinecone()
  //   const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!)
  //   const db = await PineconeStore.fromExistingIndex(
  //     embeddings,
  //     { pineconeIndex }
  //   )
  //   doc = await db.similaritySearch(searchKey, 1);
  // }
  
  // const yaml = YAML.parse(doc[0].pageContent)

  const payloadForTitle = `
  You are a top e-commerce seller. Given the product SKU category and the product's selling keywords, you will generate its product title in ${language} language, nothing else.
  
  User Input
  Category: ${productCategory},
  Keywords: ${productKeywords.join(",")}

  Expected output in Xiaohongshu style and simple one liner
`
  const title = await autoGen(payloadForTitle)

  const payloadForDescription = `
  You are a top e-commerce seller. Given the product SKU category and the product's selling keywords, you will generate its product description in ${language} language, nothing else.
  
  User Input
  Category: ${productCategory},
  Keywords: ${productKeywords.join(",")}

  Expected output in Xiaohongshu style and better with paragraphs and just a few emoji
`
  const description = await autoGen(payloadForDescription)

  return {
    title: title.replaceAll('"', ''),
    description: description
  } as ProductTitleAndDescription
}
