# Migration Example: Converting a React Component to Next.js

## Example 1: Simple Page with Data Fetching

### Before (React with React Router)
```jsx
// src/pages/Projects.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Projects</h1>
      {projects.map(project => (
        <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
          {project.name}
        </div>
      ))}
    </div>
  );
}
```

### After (Next.js - Option A: Server Component)
```tsx
// app/dashboard/projects/page.tsx
import Link from 'next/link';

async function getProjects() {
  // This runs on the server - can access database directly
  const res = await fetch('http://localhost:3000/api/projects', {
    cache: 'no-store' // Force fresh data
  });
  return res.json();
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <h1>Projects</h1>
      {projects.map(project => (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <div>{project.name}</div>
        </Link>
      ))}
    </div>
  );
}
```

### After (Next.js - Option B: Client Component with SWR)
```tsx
// app/dashboard/projects/page.tsx
'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useSWR('/api/projects', fetcher);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Projects</h1>
      {projects?.map(project => (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <div>{project.name}</div>
        </Link>
      ))}
    </div>
  );
}
```

## Example 2: Form with State

### Before (React)
```jsx
// src/components/CreateProject.jsx
import { useState } from 'react';

export function CreateProject() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setLoading(false);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
```

### After (Next.js with Server Action)
```tsx
// app/dashboard/projects/actions.ts
'use server';

import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  
  await db.insert(projects).values({ name });
  revalidatePath('/dashboard/projects'); // Refresh the page
  
  return { success: true };
}

// app/dashboard/projects/create/page.tsx
'use client';

import { useActionState } from 'react';
import { createProject } from '../actions';

export default function CreateProjectPage() {
  const [state, formAction, isPending] = useActionState(createProject, null);

  return (
    <form action={formAction}>
      <input 
        name="name"
        placeholder="Project name"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```

## Example 3: Layout with Navigation

### Before (React Router)
```jsx
// src/components/DashboardLayout.jsx
import { Link, useLocation } from 'react-router-dom';

export function DashboardLayout({ children }) {
  const location = useLocation();

  return (
    <div className="flex">
      <aside>
        <nav>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/dashboard/projects" className={location.pathname === '/dashboard/projects' ? 'active' : ''}>
            Projects
          </Link>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

### After (Next.js)
```tsx
// app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex">
      <aside>
        <nav>
          <Link 
            href="/dashboard" 
            className={pathname === '/dashboard' ? 'active' : ''}
          >
            Home
          </Link>
          <Link 
            href="/dashboard/projects"
            className={pathname === '/dashboard/projects' ? 'active' : ''}
          >
            Projects
          </Link>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

## Example 4: Context Provider

### Before (React)
```jsx
// src/context/ThemeContext.jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### After (Next.js - Same, but mark as Client Component)
```tsx
// app/dashboard/providers.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const ThemeContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Then wrap in app/dashboard/layout.tsx
import { ThemeProvider } from './providers';

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

## Key Takeaways

1. **Server Components are powerful** - Use them for data fetching when possible
2. **Client Components for interactivity** - Only when you need hooks or browser APIs
3. **Server Actions replace API routes** - Simpler form handling
4. **File-based routing** - Pages are files, not route config
5. **Same React patterns work** - Context, hooks, etc. work the same in Client Components
