# Project: SAP O2C (Order-to-Cash) Context Graph System

This project is a full-stack web application consisting of a Next.js frontend and a Node.js/Express backend that utilizes `better-sqlite3` for local persistent graph data. This file serves to provide AI coding assistants (like Claude) with essential context and global instructions for interacting with this codebase.

## Project Structure
- `/frontend`: Next.js application (React, TailwindCSS).
- `/backend`: Node.js Express server with TypeScript. Handles the graph logic and SQLite database.
- `/backend/data`: Persistent storage directory mapping for `o2c.db` SQLite database.

## System Prompts & Instructions for AI
1. **TypeScript First**: Always favor TypeScript interfaces and strictly types over `any`.
2. **Backend Architecture**: The backend uses an Express router architecture (`routes/graph.ts`, `routes/query.ts`). The database is purely SQLite but models a graph structure logically with Tables for Nodes (Customers, Addresses, Products) and Edges (Relationships like `PLACED_BY`, `SHIPS_TO`, `CONTAINS`).
3. **Frontend Architecture**: Use Next.js App Router conventions. Place reusable components in `/frontend/components`.
4. **Environment Variables**: Use `.env` files in both frontend and backend for configuration. Ensure the frontend targets `localhost:3001` or the specific `NEXT_PUBLIC_API_URL` when calling the backend.
5. **Linting and Formatting**: Before proposing any major changes, ensure standard ES modules and Next.js typical styles are maintained. Keep changes minimal to avoid breaking the CI/CD pipeline.
6. **Commands**:
   - Backend Dev: `cd backend && npm run dev`
   - Frontend Dev: `cd frontend && npm run dev`
   - Seed Database: `cd backend && npm run seed`

## Recent Changes (Claude Code context)
- Configured foundational CI/CD workflows under `.github/workflows/ci.yml`.
- `.env` files populated for both `/frontend` and `/backend`. 
- CORS established in backend to accept traffic from `localhost:3000` (Frontend).

## Goal
Help the human develop, deploy, and refine this SAP O2C context graph system by suggesting concise, robust, and correctly typed code. ALWAYS review this document before beginning complex refactors.
