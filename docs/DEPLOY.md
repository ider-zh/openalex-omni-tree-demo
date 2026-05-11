# ============================================
# OpenAlex Topics Tree - Deployment Scripts
# ============================================

# -------------------------------------------
# 1. Local Development
# -------------------------------------------

# Install dependencies
npm install

# Start Vite development server (hot reload, localhost:5173)
npm run dev

# -------------------------------------------
# 2. Build for Production
# -------------------------------------------

# Build optimized production bundle
npm run build

# Preview production build locally (localhost:4173)
npm run preview

# -------------------------------------------
# 3. Deploy to Cloudflare Pages
# -------------------------------------------

# Option A: Via Cloudflare Dashboard (Recommended)
# 1. Push your code to GitHub
# 2. Go to https://dash.cloudflare.com/ → Workers & Pages
# 3. Click "Create application" → Pages
# 4. Connect to Git → Select your repository
# 5. Build settings:
#    - Framework preset: None
#    - Build command: npm run build
#    - Build output directory: dist
#    - Root directory: /
# 6. Click "Save and Deploy"

# Option B: Via Wrangler CLI
# 1. Install Wrangler: npm install -g wrangler
# 2. Login: wrangler login
# 3. Deploy: wrangler pages deploy dist --project-name=openalex-topics-tree

# -------------------------------------------
# 4. Update Data (Optional)
# -------------------------------------------

# Crawl fresh data from OpenAlex API
npm run crawl

# Process data into tree structure
npm run process-data

# Validate data integrity
npm run validate

# -------------------------------------------
# 5. Useful Commands
# -------------------------------------------

# Check data statistics
npm run check-data

# Verify API consistency
npm run verify-api

# Clean build artifacts
npm run clean          # macOS/Linux
npm run clean:win      # Windows

# -------------------------------------------
# Environment Variables (Optional)
# -------------------------------------------
# VITE_OPENALEX_API_KEY=your_api_key_here  # For higher rate limits
# VITE_SITE_URL=https://your-domain.com     # For custom domain

# -------------------------------------------
# Project Structure
# -------------------------------------------
# openalex-topics-tree/
# ├── index.html              → Main entry point (single-file React app)
# ├── package.json            → Project configuration and scripts
# ├── vite.config.ts          → Vite build configuration
# ├── tsconfig.json           → TypeScript configuration
# ├── wrangler.toml           → Cloudflare Pages configuration
# │
# ├── src/                    → Frontend source code
# │   ├── components/         → React components
# │   ├── App.tsx             → Main application component
# │   ├── main.tsx            → Application entry point
# │   ├── api.ts              → API utilities
# │   ├── types.ts            → TypeScript type definitions
# │   └── index.css           → Global styles
# │
# ├── data/                   → Static data files (not part of frontend)
# │   ├── topics.json         → Raw topics from OpenAlex
# │   ├── topics-tree.json    → Hierarchical tree structure
# │   ├── search-index.json   → Search index for quick lookup
# │   └── stats.json          → Data statistics
# │
# ├── scripts/                → Data collection and utility scripts
# │   ├── crawler.js          → Crawl topics from OpenAlex API
# │   ├── process-data.js     → Process raw data into tree structure
# │   ├── validate-data.js    → Validate data integrity
# │   ├── check-data.js       → Check data statistics
# │   ├── verify-api-consistency.js → Verify API consistency
# │   ├── server.cjs          → Simple production server
# │   └── server.js           → Alternative server implementation
# │
# ├── tests/                  → Test scripts and test data
# │   ├── check-crawler-anomalies.js → Check crawler for anomalies
# │   ├── check-original.js   → Check original data
# │   ├── check_topics.cjs    → Topic verification script
# │   ├── check_topics.ps1    → PowerShell topic checker
# │   ├── check_topics_detailed.cjs → Detailed topic check
# │   ├── test-server.js      → Server test script
# │   ├── simple-verify.js    → Simple verification script
# │   └── manual-test.html    → Manual testing page
# │
# ├── docs/                   → Documentation files
# │   ├── DEPLOY.md           → This deployment guide
# │   ├── CHROME_MCP_TEST_GUIDE.md → Chrome DevTools testing guide
# │   └── TEST_INSTRUCTIONS.md → Testing instructions
# │
# ├── public/                 → Static assets served as-is (if any)
# ├── dist/                   → Production build output (auto-generated)
# ├── .gitignore              → Git ignore patterns
# ├── .env.example            → Environment variables template
# └── README.md               → Project documentation

# -------------------------------------------
# Notes
# -------------------------------------------
# - The project uses CDN-hosted React (no npm build required for index.html)
# - The Vite build is for the src/ directory (if you want to use the React app)
# - Data files in data/ are pre-crawled and ready to use
# - No backend server required - static site works on any hosting
