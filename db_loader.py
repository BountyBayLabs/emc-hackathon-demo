from langchain import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.document_loaders import TextLoader
from langchain_pinecone import PineconeVectorStore

loader = DirectoryLoader("./doc", glob="*.yaml", loader_cls=TextLoader)
documents = loader.load()
embeddings = OpenAIEmbeddings()

# for local dev
# db = FAISS.from_documents(documents, embeddings)
# print(db.index.ntotal)

index_name = "emc-demo"

# for prod setup
# db = PineconeVectorStore.from_documents(documents, embeddings, index_name=index_name)

# for testing
db = PineconeVectorStore(index_name=index_name, embedding=embeddings)

query = "men tops"
docs = db.similarity_search(query)
print(docs[0].page_content)

# for local dev only
# db.save_local("./data")