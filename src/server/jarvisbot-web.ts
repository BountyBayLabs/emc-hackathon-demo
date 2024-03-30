import { ProductCategoryAndKeywords, ProductTitleAndDescription } from "@/types/product";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import YAML from 'yaml'
import * as path from "path";

const autoGen = async (payload: any) => {
  // clear history
  await fetch('https://jarvis.emchub.ai/oca/v1/ftIm/tempNewChat', {
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "token": `${process.env.JARVISBOT_WEB_TOKEN}`
    },
    body: JSON.stringify({
      newType: 0
    }),
  })

  // send ask
  await fetch('https://jarvis.emchub.ai/oca/v1/ftIm/tempChat', {
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "token": `${process.env.JARVISBOT_WEB_TOKEN}`
    },
    body: JSON.stringify({
      content: payload
    }),
  })

  // get answer
  const res = await fetch('https://jarvis.emchub.ai/oca/v1/ftIm/tempChatHistory', {
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "token": `${process.env.JARVISBOT_WEB_TOKEN}`
    },
    body: JSON.stringify({
      limit: 2
    }),
  })
  const json = await res.json()
  console.log(json)
  return json.data[1].textContent
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
