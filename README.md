# React + Vite + Supabase Login

This project is a React app bootstrapped with Vite, featuring Supabase authentication (login).

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Configure Supabase credentials:
   - Copy `.env.example` to `.env`:
     ```sh
     cp .env.example .env
     ```
   - Edit `.env` and add your Supabase project URL and anon key:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. Start the development server:
   ```sh
   npm run dev
   ```

## Authentication

Supabase login functionality is implemented in `src/components/SupabaseLogin.jsx`.

The app will display a configuration message until you provide your Supabase credentials in the `.env` file. Once configured, users can log in with email and password using Supabase Auth.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
