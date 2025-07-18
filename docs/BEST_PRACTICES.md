# Supabase and Vercel Best Practices

This document summarizes recommended practices for deploying Next.js applications on Vercel with Supabase. These guidelines consolidate key points from the official documentation for both platforms.

## 1. Supabase Optimization

- **Row-Level Security (RLS)**
  - Enable RLS on all tables.
  - Index columns referenced in policies to avoid performance issues.
  - Wrap authentication helper functions in `SELECT` statements for better query planning.
- **Connection Pooling**
  - Use Supabase's PgBouncer or Supavisor when running in serverless environments.
  - Connection limits range from ~60 on micro instances to ~480 on XL instances.
- **Schema Design**
  - Prefer auto-incrementing `BIGINT` identity columns for primary keys.
  - Create foreign key indexes and leverage PostgreSQL features like `JSONB`.
- **IPv4 Compatibility**
  - Supavisor ensures pooled connections work with Vercel's IPv4-only networking.

## 2. Vercel Optimization

- **Core Web Vitals**
  - Monitor **Interaction to Next Paint (INP)**, **Cumulative Layout Shift (CLS)**, and **Largest Contentful Paint (LCP)**.
  - Use Vercel Speed Insights to track metrics in production.
- **Edge and Caching**
  - Employ Incremental Static Regeneration (ISR) for hybrid content.
  - Apply caching headers (`Cache-Control`, `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`).
  - Leverage edge middleware for authentication and personalization.
- **Build Optimization**
  - Use Turborepo in monorepos for remote caching to speed up builds.
  - Vercel automatically optimizes images and fonts when correctly configured.

## 3. Supabase + Vercel Integration

- The Vercel marketplace integration provides 12 environment variables for pooled and direct connections.
- Variables like `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` support Prisma and migrations.
- For server-side authentication, prefer `getUser()` from `@supabase/ssr` instead of `getSession()`.
- Upload files larger than Vercel’s 4.5 MB limit directly to Supabase Storage using the TUS protocol.

## 4. Security Recommendations

- Use declarative schema management and version control for database changes.
- Wrap RLS policies in security-definer functions when necessary.
- Rotate JWT secrets and environment variables regularly.
- On Vercel, enable Content Security Policy headers, WAF, and deployment protection.
- Enable monitoring and error tracking (e.g., Vercel Observability Plus) from day one.

These practices help achieve high performance and secure deployments when combining Supabase with Vercel. The "NExtER" name refers to this project and is not an official framework. Established boilerplates from the community provide reliable starting points for production systems.

