

# Phase 10: Advanced Store Builder — Pages, Blogs, Hero, Footer, AI Content & Engagement Reports

This phase transforms the basic "pick a theme" Store Design into a full **page builder** giving sellers complete creative control — similar to Myntra's rich storefront with mega-nav, hero banners, blogs, newsletters, and customizable footer/logo placement.

## What We Will Build

### 10A: Homepage Builder (Drag-and-Drop Sections)
- Replace the current static hero + product grid with a **section-based homepage builder**
- Sellers choose from section types: Hero Banner, Featured Products, Category Grid, Testimonials, Newsletter Signup, Custom Text/Image Block, Banner Carousel
- Each section is configurable (title, subtitle, image, layout variant)
- Sections are reorderable via drag-and-drop (using `@dnd-kit/core`)
- Hero section supports: **upload custom image** or **AI-generate a hero image** using Lovable AI image generation
- Store settings JSONB stores the section layout as an array of section configs

### 10B: Blog System
- New `blog_posts` table: id, store_id, title, slug, body (rich text/markdown), cover_image, is_published, created_at
- Blog list page on storefront: `/store/:slug/blog`
- Blog detail page: `/store/:slug/blog/:postSlug`
- Seller dashboard page to create/edit/delete blog posts (`/blog-posts`)
- **AI blog generation**: Seller provides a topic, AI writes the full blog post using Lovable AI edge function
- Cover image upload or AI generation

### 10C: Newsletter Signup
- New `newsletter_subscribers` table: id, store_id, email, subscribed_at
- Newsletter signup section available as a homepage section block
- Seller can view subscriber list in dashboard (`/subscribers`)
- Simple email collection with duplicate prevention

### 10D: Logo & Footer Customization
- Store Design page gets new tabs: **Header** and **Footer**
- **Header config**: Logo position (left/center), logo size, show/hide store name beside logo, navigation links (Home, Shop, Blog, About)
- **Footer config**: Custom footer text, social media links (Instagram, Facebook, Twitter, YouTube), payment badge display, custom links (Privacy, Terms, About Us), "Powered by" toggle
- All saved in store settings JSONB

### 10E: Store Engagement Report (AI-Powered)
- New dashboard page: `/analytics` (Engagement Report)
- Pulls data: product count, order count, review average, blog post count, SEO completeness, page structure
- Calls Lovable AI to analyze the store and generate:
  - Engagement score (0-100)
  - Strengths list
  - Improvement suggestions (e.g., "Add a hero image", "Write 3 blog posts", "Add product descriptions to 4 products missing them")
  - Product-level recommendations
- Visual score card with progress indicators

### 10F: Storefront Mega-Navigation (Myntra-style)
- Desktop: Hover-triggered category mega-menu showing product categories in columns (like the Myntra screenshot)
- Mobile: Category drawer accessible from bottom nav
- Navigation items configurable from Store Design header settings

## Database Changes

```sql
-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  body text DEFAULT '',
  cover_image text,
  is_published boolean DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS: owners manage, public reads published
CREATE POLICY "Store owners manage blog posts" ON public.blog_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = blog_posts.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Public can read published posts" ON public.blog_posts FOR SELECT
  USING (is_published = true AND EXISTS (SELECT 1 FROM stores WHERE stores.id = blog_posts.store_id AND stores.is_published = true));

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  email text NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  UNIQUE(store_id, email)
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Store owners can view subscribers" ON public.newsletter_subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = newsletter_subscribers.store_id AND stores.user_id = auth.uid()));
```

## New Files

| File | Purpose |
|------|---------|
| `src/pages/StoreDesign.tsx` | Complete rewrite: tabs for Themes, Homepage Builder, Header, Footer, Customize |
| `src/components/store-design/HomepageBuilder.tsx` | Drag-and-drop section editor with add/remove/reorder |
| `src/components/store-design/HeroSectionEditor.tsx` | Hero image upload + AI generation config |
| `src/components/store-design/HeaderEditor.tsx` | Logo position, nav links, store name toggle |
| `src/components/store-design/FooterEditor.tsx` | Social links, custom text, payment badges, powered-by toggle |
| `src/pages/BlogPosts.tsx` | Seller dashboard: blog post list + CRUD |
| `src/pages/BlogPostForm.tsx` | Create/edit blog with AI generation button |
| `src/pages/Subscribers.tsx` | Newsletter subscriber list |
| `src/pages/StoreAnalytics.tsx` | AI-powered engagement report |
| `src/pages/storefront/StorefrontBlog.tsx` | Public blog list page |
| `src/pages/storefront/StorefrontBlogPost.tsx` | Public blog detail page |
| `src/components/storefront/MegaNav.tsx` | Myntra-style category mega-menu |
| `src/components/storefront/NewsletterSection.tsx` | Email signup section for storefront |
| `src/components/storefront/StorefrontFooter.tsx` | Customizable footer with social links |
| `src/hooks/useBlogPosts.ts` | CRUD hooks for blog posts |
| `src/hooks/useNewsletterSubscribers.ts` | Subscribe + list hooks |
| `supabase/functions/generate-blog/index.ts` | AI blog content generation |
| `supabase/functions/store-engagement/index.ts` | AI engagement analysis |
| `supabase/functions/generate-hero-image/index.ts` | AI hero image generation |

## Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes: `/blog-posts`, `/blog-posts/:id`, `/subscribers`, `/analytics`, `/store/:slug/blog`, `/store/:slug/blog/:postSlug` |
| `src/components/DashboardLayout.tsx` | Add nav items: Blog Posts, Subscribers, Analytics |
| `src/components/storefront/StorefrontLayout.tsx` | Replace simple header/footer with MegaNav + StorefrontFooter, render homepage sections dynamically |
| `src/pages/Storefront.tsx` | Render section-based homepage from store settings instead of hardcoded hero+grid |

## Technical Details

- **Homepage sections** stored as `store.settings.homepage_sections: Array<{ type, title, subtitle, image, layout, order }>` in the stores table JSONB
- **AI Hero Image**: Edge function calls Lovable AI image generation (`google/gemini-2.5-flash-image`) with store category context
- **AI Blog Generation**: Edge function sends topic + store context to `google/gemini-3-flash-preview` and returns title + body
- **AI Engagement Report**: Edge function receives store stats and product data, returns structured analysis via tool calling
- **Drag-and-drop**: Uses `@dnd-kit/core` + `@dnd-kit/sortable` for section reordering
- **Mega-nav**: CSS grid-based dropdown on hover (desktop), Sheet-based drawer on mobile, populated from product categories
- **Footer**: Rendered from `store.settings.footer` config object with social links, custom text, and toggle options

