# React to Next.js Dashboard Migration Guide

## Overview
This guide will help you migrate your React project into the Next.js dashboard folder structure.

## Key Differences: React vs Next.js

### 1. **Component Types**
- **Client Components** (`'use client'`): For interactivity (useState, useEffect, event handlers)
- **Server Components** (default): For data fetching and static content
- **Rule**: Server Components by default, only add `'use client'` when needed

### 2. **Routing**
- React Router → Next.js File-based routing
- `/src/pages/Home.jsx` → `/app/dashboard/page.tsx`
- `/src/pages/Settings/Profile.jsx` → `/app/dashboard/settings/profile/page.tsx`
- Nested routes use `layout.tsx` files

### 3. **Data Fetching**
- `fetch()` in Server Components (no useEffect needed)
- `useSWR` or `fetch()` in Client Components for client-side fetching
- Next.js API routes replace separate backend files

## Step-by-Step Migration Plan

### Step 1: Analyze Your React Project Structure

Create a mapping of your current structure:
```
Your React Project            →  Next.js Location
/src/components/              →  /components/
/src/pages/Dashboard/         →  /app/dashboard/
/src/api/                     →  /app/api/ or Server Actions
/src/utils/                   →  /lib/
/src/assets/                  →  /public/ or /app/assets/
```

### Step 2: Convert Route Components to Pages

For each route in your React app:

**Before (React Router):**
```jsx
// src/pages/Projects.jsx
export function Projects() {
  return <div>Projects Page</div>
}
```

**After (Next.js):**
```tsx
// app/dashboard/projects/page.tsx
export default function ProjectsPage() {
  return <div>Projects Page</div>
}
```

**Key changes:**
- Export as `default`
- Name it `page.tsx` (or `layout.tsx` for layouts)
- File location = URL path

### Step 3: Handle Client-Side Features

**Components with hooks → Client Components:**
```tsx
// app/dashboard/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  // ... rest of component
}
```

**Important**: Only the top-level component needs `'use client'` if it imports client hooks.

### Step 4: Convert API Calls

**Option A: Server Components (Recommended)**
```tsx
// app/dashboard/projects/page.tsx (Server Component, no 'use client')
async function getProjects() {
  const res = await fetch('https://api.example.com/projects');
  return res.json();
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsList projects={projects} />;
}
```

 editors  
**Option B: Client-Side Fetching**
```tsx
// app/dashboard/projects/page.tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProjectsPage() {
  FunctionComponent
  const { data: projects } = useSWR('/api/projects', fetcher);
  // ... rest
}
```

**Option C: Next.js API Routes**
```tsx
// app/api/projects/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Fetch from external API or database
  const projects = await getProjectsFromDB();
  return NextResponse.json(projects);
}
```

### Step 5: Handle Routing/Navigation

**React Router:**
```jsx
import { Link, useNavigate } from 'react-router-dom';
<Link to="/dashboard/settings">Settings</Link>
```

**Next.js:**
```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

<Link href="/dashboard/settings">Settings</Link>

// Programmatic navigation
const router = useRouter();
router.push('/dashboard/settings');
```

### Step 6: Convert Forms

**React (fetch to external API):**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  await fetch('/api/create', { method: 'POST', body: formData });
};
```

**Next.js Server Actions (Recommended):**
```tsx
// app/dashboard/projects/actions.ts
'use server';

export async function createProject(formData: FormData) {
  const name = formData.get('name');
  // Server-side logic
  return { success: true };
}

// app/dashboard/projects/page.tsx
import { createProject } from './actions';

export default function ProjectsPage() {
  return (
    <form action={createProject}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Step 7: Handle State Management

**Context API / Redux / Zustand:**
- These work the same in Client Components
- Create providers as Client Components
- Wrap layouts with providers

```tsx
// app/dashboard/providers.tsx
'use client';

import { createContext } from 'react';

export const ThemeContext = createContext();

export function Providers({ children }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Protege app/layout.tsx or app/dashboard/layout.tsx
import { Providers } from './providers';

export default function Layout({ children }) {
  return <Providers>{children}</Providers>;
}
```

### Step 8: Static Assets

**Images:**
```tsx
// React
<img src="/assets/logo.png" />

// Next.js (recommended)
import Image from 'next/image';
<Image src="/logo.png" width={200} height={200} alt="Logo" />

// Or if in public folder:
<img src="/logo.png" /> // Same as React
```

**Files to move:**
- `/src/assets/` → `/public/` (for static assets)
- `/src/assets/` → `/app/assets/` (if you need imports)

### Step 9: Environment Variables

**React:**
```js
const apiUrl = process.env.REACT_APP_API_URL;
```

**Next.js:**
```ts
// Server-side (safe)
const apiUrl = process.env.API_URL;

// Client-side (must prefix with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Step 10: Middleware & Authentication

Your Next.js app already has authentication middleware. Your migrated components will automatically be protected if they're in `/app/dashboard/`.

## Quick Migration Checklist

- [ ] Map all routes to Next.js file structure
- [ ] Convert route components to `page.tsx` files
- [ ] Add `'use client'` to components using hooks
- [ ] Convert API calls to Server Components or API routes
- [ ] Replace React Router with Next.js Link/useRouter
- [ ] Convert forms to Server Actions (optional but recommended)
- [ ] Move static assets to `/public/` folder
- [ ] Update environment variable names (`NEXT_PUBLIC_` prefix for client)
- [ ] Test all routes and functionality
- [ ] Remove React Router dependencies

## Recommended Folder Structure

```
app/
  (dashboard)/
    dashboard/
      layout.tsx              # Dashboard layout with sidebar
      page.tsx                # Main dashboard page
      projects/
        page.tsx              # Projects list
        [id]/
          page.tsx            # Single project page
      settings/
        page.tsx              # Settings page
        profile/
          page.tsx            # Profile settings
components/
  ui/                         # Shared UI components
  dashboard/                  # Dashboard-specific components
lib/
  api/                        # API utilities
  utils/                      # Helper functions
public/
  images/                     # Static images
  assets/                     # Other static files
```

## Common Pitfalls to Avoid

1. **Don't mix Server and Client Components incorrectly**
   - Server Components can't import Client Components that use hooks
   - Solution: Extract interactive parts into separate Client Components

2. **Don't use useEffect for initial data fetching in Server Components**
   - Use direct async/await instead

3. **Don't forget to add `'use client'` when needed**
   - Required for: useState, useEffect, event handlers, browser APIs

4. **Don't put secrets in client-side code**
   - Use Server Actions or API routes for sensitive operations

5. **Don't use `window` or `document` directly in Server Components**
   - Only in Client Components

## Next Steps

1. Start with one route/page at a time
2. Test thoroughly after each conversion
3. Keep the React version running in parallel during migration
4. Migrate shared components first
5. Then migrate page-level components
6. Finally, migrate layouts and routing

Need help with a specific part? Share your React component structure and I can help convert it!
