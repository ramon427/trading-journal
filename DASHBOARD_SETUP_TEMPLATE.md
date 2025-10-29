# Dashboard Setup Template

Use this structure as a starting point for your migrated React app.

## Folder Structure

```
app/
  (dashboard)/
    dashboard/
      layout.tsx                 # Dashboard layout (sidebar, nav)
      page.tsx                   # Main dashboard page
      
      # Add your migrated routes here:
      projects/
        page.tsx                 # /dashboard/projects
        [id]/
          page.tsx               # /dashboard/projects/[id] (dynamic route)
        create/
          page.tsx               # /dashboard/projects/create
        actions.ts               # Server actions for projects
      
      settings/
        page.tsx                 # /dashboard/settings
        layout.tsx               # Optional nested layout
        profile/
          page.tsx               # /dashboard/settings/profile
        team/
          page.tsx               # /dashboard/settings/team
```

## Template Files

### 1. Dashboard Layout Template

```tsx
// app/(dashboard)/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Import your icons (lucide-react is already installed)
import { Menu, Home, FolderKanban, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    // Add your routes here
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <h1 className="font-semibold">Dashboard</h1>
        <Button
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. Basic Dashboard Page Template

```tsx
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      {/* Add your dashboard content here */}
    </div>
  );
}
```

### 3. Server Component Page Template (for data fetching)

```tsx
// app/(dashboard)/dashboard/projects/page.tsx
// This is a Server Component - can fetch data directly

// If fetching from API route
async function getProjects() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects`, {
    cache: 'no-store', // or 'force-cache' for static
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// OR if using database directly
import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema';

async function getProjectsFromDB() {
  return await db.select().from(projects);
}

export default async function ProjectsPage() {
  // This runs on the server!
  const projects = await getProjects(); // or getProjectsFromDB()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <div className="grid gap-4">
        {projects.map((project) => (
          <div key={project.id} className="p-4 border rounded">
            <h2>{project.name}</h2>
            {/* Add more project details */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Client Component Page Template (for interactivity)

```tsx
// app/(dashboard)/dashboard/projects/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        router.push('/dashboard/projects');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </div>
  );
}
```

### 5. Server Actions Template

```tsx
// app/(dashboard)/dashboard/projects/actions.ts
'use server';

import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  
  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  try {
    await db.insert(projects).values({ name: name.trim() });
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to create project' };
  }
}

export async function deleteProject(id: number) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete project' };
  }
}
```

### 6. API Route Template

```tsx
// app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema';

export async function GET() {
  try {
    const allProjects = await db.select().from(projects);
    return NextResponse.json(allProjects);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    const [newProject] = await db
      .insert(projects)
      .values({ name })
      .returning();
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

## Quick Start Checklist

1. **Create the dashboard layout** using the template above
2. **Set up your first page** - start with one route
3. **Migrate one component at a time** - test as you go
4. **Convert data fetching** - Server Components when possible
5. **Add Server Actions** - for forms and mutations
6. **Create API routes** - if you need client-side fetching
7. **Test everything** - ensure all functionality works

## Migration Strategy

1. **Week 1: Setup & Structure**
   - Create folder structure
   - Set up dashboard layout
   - Create basic pages (empty/skeleton)

2. **Week 2: Core Features**
   - Migrate main pages
   - Convert routing
   - Set up navigation

3. **Week 3: Data & APIs**
   - Convert API calls
   - Set up Server Actions or API routes
   - Migrate forms

4. **Week 4: Polish & Test**
   - Fix edge cases
   - Test all functionality
   - Performance optimization
   - Remove old React Router code

Good luck with your migration! 🚀
