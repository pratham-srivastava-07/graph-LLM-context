# 🌐 SAP O2C Graph Context System

[![CI](https://github.com/pratham-srivastava-07/graph-LLM-context/actions/workflows/ci.yml/badge.svg)](https://github.com/pratham-srivastava-07/graph-LLM-context/actions/workflows/ci.yml)

An AI-powered application that seamlessly translates natural language queries into executable Graph SQL, running against an SAP Order-to-Cash (O2C) styled database. This project integrates cutting-edge Large Language Models (LLMs) to make complex enterprise data instantly accessible to non-technical users.

## 🚀 Key Features

- **Natural Language to SQL**: Interrogate your Orders, Customers, and Invoices using plain English. The built-in query translator utilizes Groq and Gemini APIs to synthesize deterministic queries.
- **Real SAP Data**: Fully integrated with the provided SAP O2C dataset containing 401+ real records across 8 entity types.
- **Interactive Graph Visualization**: Force-directed graph with 501 nodes and 650 edges showing real relationships in the O2C process.
- **Relational "Graph" Mapping**: Connects disparate SQL tables into traversable nodes and edges, mimicking a Graph database over traditional SQLite.
- **Interactive Chat UI**: Beautiful, fully responsive Next.js frontend that allows conversational interactions with your data.
- **Robust API**: A scalable Express.js & TypeScript backend delivering fast query resolution, integrated directly with a local persistent `better-sqlite3` instance.

---

## 📊 Dataset Overview

The system is populated with **real SAP O2C data**:

| Entity | Count | Description |
|--------|-------|-------------|
| **Customers** | 8 | Business partners from SAP system |
| **Addresses** | 8 | Billing and shipping addresses |
| **Products** | 50 | Product catalog with SKU and pricing |
| **Orders** | 100 | Sales orders with full details |
| **Order Items** | 79 | Line items within orders |
| **Deliveries** | 36 | Outbound deliveries with tracking |
| **Invoices** | 100 | Billing documents and invoices |
| **Payments** | 120 | Accounts receivable payments |

**Total**: 501 nodes, 650 edges in the graph visualization

---

## 🏗️ Architecture & Technical Decisions

### Database Choice: better-sqlite3
We chose `better-sqlite3` as our database for several key reasons:
- **Zero Infrastructure**: No external database server required, making it perfect for demonstrations and local development
- **ACID Compliance**: Ensures data integrity during complex graph traversals and joins
- **Performance**: Extremely fast read operations with minimal overhead for our graph-like SQL queries
- **TypeScript Integration**: Excellent TypeScript support with compile-time query validation
- **Portability**: Single file database that can be easily shared and version controlled

### Express Router Architecture
Our backend follows a modular Express router pattern:
- **Separation of Concerns**: Routes are split by functionality (`/query`, `/graph`, `/health`)
- **Middleware Chain**: Request validation → Guardrail filtering → LLM processing → SQL execution
- **Type Safety**: Full TypeScript coverage from request to response
- **Error Handling**: Centralized error handling with meaningful error codes and messages

### Data Ingestion Strategy
The system ingests the provided SAP O2C dataset through:
- **JSONL Parser**: Custom parser that reads SAP's JSONL format files from `backend/src/sap-o2c-data/`
- **Schema Mapping**: Transforms SAP field names to our normalized schema (e.g., `referenceSdDocument` → `order_id`)
- **Relationship Preservation**: Maintains foreign key relationships between orders, deliveries, invoices, and payments
- **Foreign Key Handling**: Temporarily disables constraints during seeding, re-enables for operation

### Frontend Application
The frontend is a **Next.js** application utilizing the App Router.
- **Visualization**: We implemented a custom **D3.js Force-Directed Graph** rendered on an HTML5 Canvas. This approach ensures high performance even with hundreds of nodes, allowing for smooth panning, zooming, and interactive node expansion.
- **UI Framework**: Integrated **Shadcn UI** and **Tailwind CSS** for a premium, accessible interface, with **Framer Motion** for state-transition animations.
- **Hydration Safety**: Implemented client-side mounting to prevent SSR hydration mismatches

---

## 🧠 LLM Prompting & Translation Strategy

Our system employs a sophisticated multi-layered approach to convert natural language into executable SQL Graph queries:

### System Prompt Engineering
The LLM receives comprehensive context including:
- **Database Schema**: Complete table definitions with field types and relationships
- **Business Context**: O2C process flow understanding (Order → Delivery → Invoice → Payment)
- **Query Patterns**: Common business question templates and their SQL equivalents
- **Constraints**: Clear instructions about read-only access and security boundaries

### Dual LLM Strategy with Fallback
1. **Primary (Groq - Llama 3)**: Fast, cost-effective for most queries
2. **Secondary (Gemini 1.5)**: Higher accuracy for complex queries with multiple joins
3. **Automatic Fallback**: System switches to Gemini if Groq fails or produces invalid SQL
4. **Rule-Based Overrides**: Common queries ("show graph", "list orders") bypass LLM entirely for instant response

### Few-Shot Learning Examples
The prompt includes curated examples:
```text
Q: "Show me all orders for customer C001" 
A: SELECT * FROM orders WHERE customer_id = 'C001'

Q: "What's the total revenue from invoices?" 
A: SELECT SUM(total_amount) as revenue FROM invoices WHERE status = 'Paid'

Q: "Find undelivered orders" 
A: SELECT * FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')
```

### SQL Validation Pipeline
1. **Syntax Check**: Validates SQL structure before execution
2. **Security Screening**: Blocks dangerous keywords (DROP, DELETE, etc.)
3. **Table Verification**: Ensures only known O2C tables are accessed
4. **Result Validation**: Checks query results for data consistency

---

## 🛡️ Guardrails & Safety Implementation

Our guardrail system operates at multiple layers to ensure security and scope compliance:

### Express Middleware Layer
Located in `backend/src/middleware/guardRails.ts`, this middleware intercepts every query:

#### Keyword Whitelist Filtering
- **Domain-Specific Keywords**: Only allows queries containing O2C terms like 'order', 'invoice', 'payment', 'customer', 'product'
- **Business Operations**: Includes action words like 'show', 'find', 'list', 'count', 'total', 'status'
- **SAP Identifiers**: Recognizes document prefixes like 'SO-', 'INV-', 'DN-', 'PAY-'

#### Pattern-Based Blocking
Regex patterns catch out-of-scope requests:
```javascript
// Blocks general AI requests
/write (?:a |an )?(?:poem|story|essay|email|code|script)/i
/who is (?!the customer|a customer)/i
/translate/i
/recipe/i
/weather/i
```

#### Standardized Rejection
All blocked queries return the exact required message:
```json
{
  "error": "This system is designed to answer questions related to the provided dataset only.",
  "code": "GUARDRAIL_VIOLATION" // or "OUT_OF_SCOPE"
}
```

### SQL Validation Layer
The `validateSQL()` function provides database-level protection:

#### DANGEROUS KEYWORD BLOCKLIST
Prevents SQL injection and data mutation:
- `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, `TRUNCATE`
- `EXEC`, `EXECUTE`, `--`, `;--`, `UNION ALL SELECT`

#### TABLE RESTRICTION
Only allows queries against known O2C tables:
- `customers`, `orders`, `order_items`, `products`
- `deliveries`, `invoices`, `payments`, `addresses`

#### READ-ONLY ENFORCEMENT
Strict validation ensures only `SELECT` statements can be executed

### Multi-Layer Defense Strategy
1. **Input Validation**: Middleware checks query intent before LLM processing
2. **LLM Constraint**: System prompts explicitly forbid dangerous operations
3. **Output Validation**: Generated SQL is validated before database execution
4. **Database Permissions**: SQLite connection is inherently read-only for SELECT operations

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
- [Node.js](https://nodejs.org/) v18+
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
