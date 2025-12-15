# Mercado Libre Net Margin Calculator

This is a web application to measure the real net margin of a Mercado Libre account by integrating sales (Mercado Libre), payments (Mercado Pago), COGS per SKU, and supplies per sale.

## Tech Stack

- **Framework:** React
- **Bundler:** Vite
- **UI:** Tailwind CSS
- **Backend & Auth:** Supabase
- **Serverless Functions:** Vercel
- **APIs:** Mercado Libre, Mercado Pago

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

This project uses Vite for development. You need Node.js and npm installed.

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.example .env.local
```

Now, fill in the values in `.env.local` with your actual credentials.

**Required Variables:**

- `VITE_SUPABASE_URL`: Your public Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your public Supabase anonymous key.
- `SUPABASE_URL`: Your Supabase project URL (can be the same as public, for server-side).
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (secret).
- `ML_CLIENT_ID`: Your Mercado Libre application Client ID.
- `ML_CLIENT_SECRET`: Your Mercado Libre application Client Secret.
- `ML_REFRESH_TOKEN`: A valid refresh token for your Mercado Libre seller account.
- `MP_ACCESS_TOKEN`: A valid access token for your Mercado Pago account.

### 4. Run Locally

You can use the Vite development server directly or run it via the Vercel CLI, which will also handle the serverless functions.

**Using Vercel CLI (Recommended):**
First, install the Vercel CLI if you haven't: `npm install -g vercel`.
```bash
vercel dev
```

**Using Vite's server:**
This will only run the frontend. API calls will fail unless you run the serverless functions separately.
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (Vite's default) or `http://localhost:3000` (Vercel's default).

## Deployment to Vercel

1.  **Push to GitHub:** Push your repository to GitHub.
2.  **Import Project in Vercel:** Create a new project in Vercel and import your GitHub repository.
3.  **Framework Preset:** Vercel should automatically detect it as a **Vite** project.
4.  **Configure Environment Variables:** In the project settings in Vercel, navigate to "Environment Variables" and add all the variables from your `.env.example` file.
5.  **Deploy:** Trigger a deployment. Vercel will run `npm run build` and deploy the output along with the serverless functions from the `/api` directory.
