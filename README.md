# 🌐 SAP O2C Graph Context System

[![CI](https://github.com/pratham-srivastava-07/graph-LLM-context/actions/workflows/ci.yml/badge.svg)](https://github.com/pratham-srivastava-07/graph-LLM-context/actions/workflows/ci.yml)

An AI-powered application that seamlessly translates natural language queries into executable Graph SQL, running against an SAP Order-to-Cash (O2C) styled database. This project integrates cutting-edge Large Language Models (LLMs) to make complex enterprise data instantly accessible to non-technical users.

## 🚀 Key Features

- **Natural Language to SQL**: Interrogate your Orders, Customers, and Invoices using plain English. The built-in query translator utilizes Groq and Gemini APIs to synthesize deterministic queries.
- **Relational "Graph" Mapping**: Connects disparate SQL tables into traversable nodes and edges, mimicking a Graph database over traditional SQLite.
- **Interactive Chat UI**: Beautiful, fully responsive Next.js frontend that allows conversational interactions with your data.
- **Robust API**: A scalable Express.js & TypeScript backend delivering fast query resolution, integrated directly with a local persistent `better-sqlite3` instance.

---

## 🏗️ Architecture Stack

| Component | Technology | Description |
| --- | --- | --- |
| **Frontend** | Next.js (App Router), React, TailwindCSS | Modern conversational UI |
| **Backend** | Node.js, Express, TypeScript | Handles logic, orchestration, and LLM communication |
| **Database** | `better-sqlite3` | Quick, reliable, edge-capable local persistent database |
| **LLMs** | Groq & Google Gemini | Provides the NLP intelligence for query generation |

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [Git](https://git-scm.com/)
- API Keys for **Groq** and **Google Gemini** (for the AI translation features)

### 1. Clone the repository
```bash
git clone https://github.com/pratham-srivastava-07/graph-LLM-context.git
cd graph-LLM-context
```

### 2. Configure Environment Variables
You will need to set up local environment files for both the frontend and backend. 

**Backend** (`backend/.env`):
```env
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

*(Note: If the files do not exist, create them in their respective root directories.)*

### 3. Setup the Backend Database
Navigate to the backend, install dependencies, and seed your local SQLite database:

```bash
cd backend
npm install
npm run build
npm run seed     # 🗄️ Automatically creates and populates the schema!
```

### 4. Run the Application

You need to run both the frontend and backend concurrently in separate terminal tabs.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# The backend API will start on http://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
# The frontend UI will be accessible at http://localhost:3000
```

---

## 📂 Project Structure

```
graph-LLM-context/
├── backend/                  # Express API Server
│   ├── data/                 # SQLite database mapping lives here after seed
│   ├── src/
│   │   ├── llm/              # Logic for Groq/Gemini integrations
│   │   ├── routes/           # Core API logic (graph, query)
│   │   └── index.ts          # Server entry
├── frontend/                 # Next.js Application
│   ├── app/                  # Pages and server components
│   ├── components/           # Reusable UI features (e.g. ChatPanel)
│   └── lib/                  # Utilities (e.g. api.ts)
├── .github/workflows/        # Automated CI/CD Actions
└── CLAUDE.md                 # Internal instructions/context for AI Assistants
```

## 🤝 Contributing
Contributions, issues and feature requests are welcome. Feel free to check the [issues page](https://github.com/pratham-srivastava-07/graph-LLM-context/issues).

## 📝 License
This project is open-source and available under the MIT License.
