"""FastAPI backend serving the chatbot UI with Groq LLM + FAISS RAG."""

import os
import textwrap
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from pypdf import PdfReader

# Load environment variables from .env file
load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_FILE = BASE_DIR / "index.html"
MODEL_DIR = BASE_DIR / "AI ChatBot"

# Configuration
GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    default="your-api-key-here"  # Fallback if not in .env
)
CHAT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
EMBED_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
TOP_K = 4

# System prompt
SYSTEM_PROMPT = textwrap.dedent("""
    You are Mehdi's secretary. Be concise and answer using the provided context (profile + docs).
    If you do not know, say you do not know. Mention the document source name when you can.
    Format your responses with:
    - Numbered lists for certifications or items
    - Bullet points (*) for skills and experiences
    - Always cite the source at the end (e.g., 'Source: Profile document')
    - Add context like 'According to Mehdi's profile...'
""").strip()

# Core profile text (fallback context)
PERSONAL_PROFILE = """
Name: Mehdi Ben Fredj
Role: AI Engineering Student
Location: Tunis, Tunisie 
Email: mehdi.benfredj15@gmail.com
Skills: Python, LangChain, LLMOps, RAG, MLOps, FastAPI, Cloud (AWS/GCP)
Experience:
- Built RAG chatbots for personal/portfolio sites.
- Deployed LLM microservices behind FastAPI with autoscaling.
- Integrated PDF/TXT ingestion for personal knowledge bases.
- Build a Personal Portfolio
Education:
- TEK-UP University 2023-2028
Projects:
- Personal website chatbot answering from CV and portfolio.
- PDF QA system with multi-file ingestion.
""".strip()


app = FastAPI(title="AskMehdi", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# Global resources
llm: Optional[ChatGroq] = None
retriever = None
vectorstore: Optional[FAISS] = None


def load_resources() -> None:
    """Load CV data and build FAISS vectorstore with Groq LLM."""
    global llm, retriever, vectorstore

    # Set Groq API key
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

    # Initialize Groq LLM
    llm = ChatGroq(model=CHAT_MODEL, temperature=0.1)
    print("[OK] Groq LLM initialized")

    # Load and prepare documents
    all_docs = []
    
    # Add profile
    profile_doc = Document(page_content=PERSONAL_PROFILE, metadata={"source": "profile"})
    all_docs.append(profile_doc)

    # Load CV PDF if it exists
    cv_path = MODEL_DIR / "sample_cv.pdf"
    if cv_path.exists():
        try:
            reader = PdfReader(cv_path)
            cv_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            cv_doc = Document(page_content=cv_text, metadata={"source": "cv.pdf"})
            all_docs.append(cv_doc)
            print(f"[OK] Loaded CV: {cv_path}")
        except Exception as e:
            print(f"⚠ Could not load CV: {e}")

    # Split documents into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(all_docs)
    print(f"[OK] Created {len(chunks)} document chunks")

    # Build vectorstore
    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": TOP_K})
    print("[OK] FAISS vectorstore and retriever ready")


def generate_answer(query: str) -> str:
    """Generate a natural answer using Groq LLM with RAG retrieval."""
    if not retriever or not llm:
        return "Model not initialized. Please restart the server."
    
    try:
        # Retrieve relevant documents
        docs = retriever.invoke(query)
        context = "\n\n".join(d.page_content for d in docs)
        
        # Build prompt
        user_prompt = f"""Context from Mehdi's CV:\n{context}\n\nQuestion: {query}\nAnswer:"""
        
        # Get response from Groq
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]
        
        response = llm.invoke(messages)
        answer = response.content if hasattr(response, "content") else str(response)
        return answer
        
    except Exception as e:
        print(f"Error generating answer: {e}")
        return f"Sorry, I encountered an error: {str(e)}"


@app.get("/")
async def root() -> FileResponse:
    return FileResponse(TEMPLATE_FILE)


@app.post("/chat")
async def chat(payload: dict):
    message = payload.get("message", "").strip() if payload else ""
    if not message:
        raise HTTPException(status_code=400, detail="No message provided")

    response_text = generate_answer(message)
    return JSONResponse({"response": response_text, "status": "success"})


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "model_loaded": llm is not None}


# Load resources at startup
try:
    load_resources()
except Exception as exc:
    print(f"[WARNING] Could not load model: {exc}")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
