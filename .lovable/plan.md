# White-Label Email Templates for Merchants

## The Problem

Currently, all customer emails (order confirmed, shipped, delivered) are sent using a generic platform template with `onboarding@resend.dev` as the sender. Customers see the platform's tech stack rather than the merchant's brand. Each store needs its own branded email identity.

## Solution Overview

Create a per-store email template system where merchants get AI-generated, fully branded email templates during onboarding — one click generates all 5 essential templates using the store's name, logo, theme colors, and category context.

---

## Technical Plan

### 1. Database: `store_email_templates` table

New table storing each store's custom HTML templates as JSONB:

```
store_email_templates
├── id (uuid, PK)
├── store_id (uuid, FK → stores)
├── templates (jsonb) — contains all template HTML keyed by type
│   ├── order_confirmed
│   ├── order_shipped
│   ├── order_delivered
│   ├── new_order_seller
│   └── welcome_customer
├── generated_at (timestamptz)
├── created_at / updated_at
```

RLS: Store owners can read/update their own templates.  
During signup and verification and foreget password of customers on the store website. Should also use the store as the main website and experices has to be flawless for customers. 

### 2. New Edge Function: `generate-email-templates`

- Accepts `store_id`
- Fetches store name, logo_url, theme (primary color, fonts), category
- Calls Lovable AI (Gemini Flash) with a prompt to generate 5 branded HTML email templates
- Each template uses the store's logo, colors, and name — zero platform branding
- Saves all templates to `store_email_templates`
- Cost: ~₹1-2 per generation (single AI call returning all 5 templates)

### 3. New Onboarding Step: "Email Branding" (Step 9, before Preview)

- Insert between Payment Setup (step 8) and Store Preview (now step 10)
- Total steps: 10 → 11
- UI: Shows the 5 template types with a large "Generate My Email Templates" button
- One click → loading animation → all templates generated
- Preview cards show mini-renders of each template
- Skippable (falls back to default templates with store name/logo)

### 4. Update `send-order-notification` Edge Function

- Before generating email HTML, check `store_email_templates` for the store
- If custom templates exist, use the stored HTML (injecting dynamic order data via placeholder replacement: `{{customer_name}}`, `{{order_number}}`, `{{items_table}}`, `{{total}}`, `{{tracking_number}}`)
- If no custom templates, fall back to current hardcoded templates
- The `from` field already uses `storeName` — will continue using that

### 5. Onboarding Data & Flow Updates

- Add `emailTemplatesGenerated: boolean` to `OnboardingData`
- Create `StepEmailBranding.tsx` component
- Update `TOTAL_STEPS` from 10 → 11
- Shift Preview to step 10, Go Live to step 11
- Update step labels array

### 6. Dashboard: Email Template Editor (post-onboarding)

- Add an "Email Templates" section in Store Design or Settings
- Merchants can regenerate templates or preview them
- Future: visual editor for fine-tuning

---

## Template Types Generated


| Template           | Trigger               | Key Content                                    |
| ------------------ | --------------------- | ---------------------------------------------- |
| Order Confirmed    | Order placed          | Logo, order items, total, "processing" message |
| Order Shipped      | Seller ships          | Logo, tracking number, carrier info            |
| Order Delivered    | Delivery confirmed    | Logo, order summary, review prompt             |
| New Order (Seller) | Customer places order | Customer details, items, payment method        |
| Welcome Customer   | First purchase        | Logo, welcome message, store intro             |


---

## What the Customer Sees

Emails arrive with:

- Store name and logo in the header
- Store's brand colors (from theme)
- Professional layout matching the store's visual identity
- Zero mention of the platform

---

## Files to Create/Modify

**Create:**

- `src/components/onboarding/StepEmailBranding.tsx`
- `supabase/functions/generate-email-templates/index.ts`
- Migration for `store_email_templates` table

**Modify:**

- `src/pages/Onboarding.tsx` — add step 9, shift others, update totals
- `supabase/functions/send-order-notification/index.ts` — use custom templates
- Memory files for the new feature