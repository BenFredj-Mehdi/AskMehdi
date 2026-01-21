# AI ChatBot Web Interface

A professional, ChatGPT-like web chatbot powered by **Groq LLM** with **FAISS** retrieval over your CV data. Built with FastAPI backend and modern HTML5/CSS3/JavaScript frontend.

## Quick Start (Windows)

### Prerequisites
- Python 3.8+ installed
- Your Groq API key (hardcoded in `app.py`)
- `sample_cv.pdf` in the `AI ChatBot/` folder

### Step 1: Activate Virtual Environment
Open PowerShell or Command Prompt in `D:\AI Project` and run:
```powershell
.venv\Scripts\Activate.ps1
```
You should see `(.venv)` at the start of the terminal line.

### Step 2: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Run the Server
```powershell
python app.py
```
Wait for startup messages. First start takes 30-60 seconds (building FAISS index).

### Step 4: Open in Browser
**http://localhost:5000**

You should see the chatbot with a greeting and example prompt cards.

---

## Features

- Modern dark theme UI (ChatGPT-like)
- Real-time chat with Groq LLM (meta-llama/llama-4-scout-17b-16e-instruct)
- RAG retrieval from your CV and profile
- Example prompt cards for quick starts
- Responsive design (desktop & mobile)
- Back button to return to main menu

## Project Structure

```
D:\AI Project\
├── index.html              # Chat UI
├── app.py                  # FastAPI server + Groq LLM
├── requirements.txt        # Dependencies
├── .venv/                  # Virtual environment
├── static/
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
└── AI ChatBot/
    ├── sample_cv.pdf      # Your CV (loaded as context)
    ├── index.faiss        # FAISS vector index
    └── index.pkl          # FAISS data
```

## How It Works

1. **Document Loading**: Your CV (PDF) and profile text are loaded on server startup
2. **Chunking**: Documents split into 800-character chunks with 120-character overlap
3. **Vectorization**: Chunks converted to embeddings using `all-MiniLM-L6-v2` model
4. **Storage**: Embeddings stored in FAISS for fast similarity search
5. **Chat Flow**: User message → FAISS retrieves relevant chunks → Groq LLM generates answer
6. **Response**: Natural, formatted answer displayed in chat UI

---

## Troubleshooting

### "ModuleNotFoundError" when running `python app.py`
**Solution**: Activate virtual environment
```powershell
.venv\Scripts\Activate.ps1
```

### "Groq API Key Invalid" or "GROQ_API_KEY not found"
**Solution**: Verify API key in `app.py` line 28. Replace with your actual key if needed.

### "sample_cv.pdf not found"
**Solution**: Ensure CV exists at `D:\AI Project\AI ChatBot\sample_cv.pdf`
The bot works with just profile text, but won't have detailed CV data.

### Server crashes or slow to start
**Solution**: First startup takes 30-60 seconds (building FAISS index). Wait and check terminal for errors.

### Chat responses are empty or very slow
**Solutions**:
- Check internet connection (Groq API needs network)
- Verify Groq API key is valid
- Restart server: Ctrl+C, then `python app.py`
- Check terminal for error messages

### Port 5000 already in use
**Solution**: Use a different port:
```powershell
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
Then visit http://localhost:8000

---

## Customization

### Change Bot Name/Profile
Edit `PERSONAL_PROFILE` in `app.py` (around line 57):
```python
PERSONAL_PROFILE = """
Name: [Your Name]
Role: [Your Role]
...
"""
```

### Change System Prompt
Edit `SYSTEM_PROMPT` in `app.py` (around line 45) to customize bot behavior.

### Change Colors
Edit `static/style.css`:
```css
:root {
    --accent-primary: #3B82F6;  /* Blue accent */
    --bg-primary: #0F172A;      /* Dark background */
}
```

### Change LLM Model
Edit `CHAT_MODEL` in `app.py`:
```python
CHAT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # Change this
```
Visit [Groq Console](https://console.groq.com) to see available models.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | FastAPI (Python) |
| **LLM** | Groq (meta-llama/llama-4-scout-17b-16e-instruct) |
| **Retrieval** | FAISS + LangChain |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) |
| **PDF Processing** | pypdf |

---

## API Endpoints

### GET `/`
Returns the chat UI (index.html)

### POST `/chat`
Send a message to the chatbot
```json
Request:  {"message": "What are your skills?"}
Response: {"response": "According to Mehdi's CV, skills include...", "status": "success"}
```

### GET `/health`
Check if server and model are loaded
```json
Response: {"status": "ok", "model_loaded": true}
```

---

## Performance Notes

- **First startup**: 30-60 seconds (building FAISS index, loading embeddings)
- **Subsequent requests**: 2-5 seconds (Groq API latency)
- **RAM usage**: ~2-3 GB (for embeddings + FAISS index)
- **Network**: Requires internet (Groq API is cloud-based)

---

## Browser Support

- **Recommended**: Chrome, Edge, Firefox (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile
- **Not supported**: Internet Explorer

---

## License

MIT License - Feel free to use and modify!

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to use and modify!
