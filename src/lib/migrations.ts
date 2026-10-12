import { getSeedStoreFromDisk } from './seed';

export interface Migration {
  id: string;
  runFile?: (store: Record<string, any>) => Promise<void> | void;
}

/**
 * Registry of store migrations for offline file store in development.
 */
export const MIGRATIONS: Migration[] = [
  {
    id: '2026-remove-packages',
    runFile: (store: Record<string, any>) => {
      const legacyPkgUrl = ['/', 'packages'].join('');
      if (Array.isArray(store.pages)) {
        store.pages = store.pages.filter((p: any) => p?.slug !== 'packages');
      }
      if (store.navigation?.mainNav && Array.isArray(store.navigation.mainNav)) {
        store.navigation.mainNav = store.navigation.mainNav.filter((item: any) => item?.url !== legacyPkgUrl);
        store.navigation.mainNav.forEach((item: any) => {
          if (Array.isArray(item.children)) {
            item.children = item.children.filter((child: any) => child?.url !== legacyPkgUrl);
          }
        });
      }
      if (store.navigation?.footer?.columns && Array.isArray(store.navigation.footer.columns)) {
        store.navigation.footer.columns.forEach((col: any) => {
          if (Array.isArray(col.links)) {
            col.links = col.links.filter((l: any) => l?.url !== legacyPkgUrl);
          }
        });
      }
    },
  },
  {
    id: '2026-canonical-experiences-urls',
    runFile: (store: Record<string, any>) => {
      const normalizeUrl = (u: string) => {
        if (!u) return u;
        if (u === '/experience' || u === '/services' || u === '/service' || u === '/experience/all-curated-experiences') {
          return '/experiences';
        }
        if (u === '/experience/go-beyond' || u === '/services/beyond-the-map' || u === '/experience/beyond-the-map') {
          return '/experiences/beyond-the-map';
        }
        if (u === '/experience/go-spiritual' || u === '/services/spiritual-wellness' || u === '/experience/spiritual-wellness') {
          return '/experiences/spiritual-wellness';
        }
        if (u === '/experience/feel-closer' || u === '/services/homestays' || u === '/experience/homestays') {
          return '/experiences/homestays';
        }
        if (u === '/experience/leave-a-mark' || u === '/services/leave-a-mark') {
          return '/experiences/leave-a-mark';
        }
        if (u === '/experience/custom-private-journeys' || u === '/services/custom-journeys' || u === '/experience/custom-journeys') {
          return '/experiences/custom-journeys';
        }
        if (u.startsWith('/experience/')) {
          return u.replace('/experience/', '/experiences/');
        }
        if (u.startsWith('/services/')) {
          return u.replace('/services/', '/experiences/');
        }
        return u;
      };

      if (store.navigation?.mainNav && Array.isArray(store.navigation.mainNav)) {
        store.navigation.mainNav.forEach((item: any) => {
          item.url = normalizeUrl(item.url);
          if (Array.isArray(item.children)) {
            item.children.forEach((c: any) => { c.url = normalizeUrl(c.url); });
          }
        });
      }
      if (store.navigation?.footer?.columns && Array.isArray(store.navigation.footer.columns)) {
        store.navigation.footer.columns.forEach((col: any) => {
          if (Array.isArray(col.links)) {
            col.links.forEach((l: any) => { l.url = normalizeUrl(l.url); });
          }
        });
      }
      if (Array.isArray(store.pages)) {
        store.pages.forEach((p: any) => {
          p.url = normalizeUrl(p.url);
          if (p.seo?.canonicalUrl) {
            p.seo.canonicalUrl = normalizeUrl(p.seo.canonicalUrl);
          }
        });
      }
      if (Array.isArray(store.experiences)) {
        store.experiences.forEach((e: any) => {
          if (e.ctaLink) e.ctaLink = normalizeUrl(e.ctaLink);
        });
      }
    },
  },
  {
    id: '2026-sync-all-37-blogs',
    runFile: (store: Record<string, any>) => {
      const seedStore = getSeedStoreFromDisk();
      const canonicalBlogs: any[] = seedStore.blogs || [];
      if (!Array.isArray(store.blogs) || store.blogs.length < canonicalBlogs.length) {
        const blogMap = new Map<string, any>();
        if (Array.isArray(store.blogs)) {
          store.blogs.forEach((b: any) => {
            if (b.slug) blogMap.set(b.slug, b);
          });
        }
        canonicalBlogs.forEach((cBlog: any) => {
          if (!blogMap.has(cBlog.slug)) {
            blogMap.set(cBlog.slug, cBlog);
          }
        });
        store.blogs = Array.from(blogMap.values());
      }
    },
  },
];

/**
 * Runs pending migrations against offline file store in development when CMS_STORAGE=file.
 */
export function runPendingFileMigrations(store: Record<string, any>): boolean {
  if (!Array.isArray(store.migrations)) {
    store.migrations = [];
  }

  let modified = false;
  for (const m of MIGRATIONS) {
    if (!store.migrations.includes(m.id)) {
      if (m.runFile) {
        m.runFile(store);
      }
      store.migrations.push(m.id);
      modified = true;
    }
  }
  return modified;
}
