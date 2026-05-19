# How categories work today (answering your first question)

The dropdown values (`general`, `luxury`, `beauty`, `fashion`, `food`, `wellness`, `indian/heritage`, `creative/tech`, `lifestyle`) are **just labels** — there is no per-category prompt.

What happens with that label:
1. It is interpolated into one line of the AI prompt: `…brand identity for a "${category}" store theme.`
2. It is used to filter the `theme_section_blueprints` table (`category_tags`) so we reuse pre-approved sections.
3. It is used to look up cached AI images in `theme_image_pool` (so a 2nd "fashion" theme reuses fashion imagery → cheap).

So adding categories = adding strings. The real lift is (a) seeding blueprints/images per new category so cost stays low, and (b) writing a **category brief** that nudges the AI (palette mood, vocabulary, hero composition) — otherwise "books" gets a generic store.

This also explains the book-author issue: every section type today is commerce (`featured_products`, `category_grid`, `collection_showcase`, `trust_badges`, `newsletter`). The generator literally cannot output "Book a consultation" because that section type doesn't exist.

---

# Phase 1 — Product Category Expansion

## 1.1 Full taxonomy (Indian SMB market research)

Two-level: **Vertical → Subcategory**. Vertical drives the AI brief; subcategory drives blueprint/image pool lookup so cost stays low.

```
Fashion & Apparel        womens-ethnic, womens-western, mens-ethnic, mens-western,
                         kids, footwear, bags, accessories, jewellery-fashion,
                         innerwear, plus-size, maternity, sportswear

Jewellery & Luxury       gold, silver, diamond, gemstone, artificial, watches,
                         luxury-leather, designer-couture

Beauty & Personal Care   skincare, haircare, makeup, fragrance, mens-grooming,
                         ayurvedic-beauty, korean-beauty, salon-products

Health & Wellness        ayurveda, supplements, fitness-equipment, yoga,
                         medical-devices, sexual-wellness, mother-baby-care,
                         elderly-care, hearing-aids, optical

Food & Beverage          packaged-snacks, sweets-mithai, bakery, chocolates,
                         beverages, tea-coffee, dairy, organic-produce,
                         spices-masala, dry-fruits, pickles-condiments,
                         ready-to-eat, healthy-food, beverages-alcohol

Home & Living            furniture, home-decor, kitchenware, dining,
                         bedding-bath, lighting, storage, garden-outdoor,
                         art-wall-decor, religious-puja, cleaning-supplies

Electronics & Gadgets    mobile-accessories, audio, computers, smart-home,
                         cameras, gaming, wearables, appliances-small,
                         appliances-large, refurbished

Kids & Baby              toys, baby-clothing, baby-gear, school-supplies,
                         books-kids, educational-toys, diapering, feeding

Books & Stationery       fiction, non-fiction, academic, regional-language,
                         comics, art-supplies, office-stationery, planners

Sports & Fitness         gym-equipment, cricket, football, badminton, yoga-gear,
                         cycling, outdoor-adventure, fitness-apparel

Automotive               car-accessories, bike-accessories, helmets,
                         car-care, ev-accessories

Pets                     dog, cat, bird, fish, pet-food, pet-grooming, pet-accessories

Art & Handicraft         handloom, pottery, paintings, sculptures, craft-kits,
                         madhubani-warli, brass-metalware, woodcraft

Festive & Gifts          diwali, rakhi, wedding-gifts, corporate-gifts,
                         personalised-gifts, hampers

Religious                puja-items, idols, books-religious, incense,
                         islamic, christian, sikh, jain

Agricultural             seeds, farming-tools, dairy-equipment, organic-inputs,
                         livestock-supplies

Industrial / B2B         packaging, safety-gear, MRO-tools, office-furniture,
                         hospitality-supplies

Hobby & Niche            musical-instruments, photography-gear, model-kits,
                         collectibles, board-games, fishing
```

~18 verticals, ~140 subcategories. Covers >95% of Indian e-commerce SMBs (mapped against Flipkart/Amazon India top-level + Meesho seller mix + ONDC catalogue).

## 1.2 Category brief layer (`theme_category_briefs` table)

New table: `id, vertical, subcategory, prompt_addendum, palette_hints, vocabulary, hero_archetypes, section_priority[], image_style`.

Generator change (one prompt insertion):
```
Vertical: ${vertical} / ${subcategory}
Brief: ${prompt_addendum}
Preferred section order: ${section_priority}
Tone & vocabulary: ${vocabulary}
```

Result: "books → fiction" gets a literary palette + section order `[hero, author_quote, featured_products, story_excerpt, reviews, newsletter]` — not generic "Shop by Category".

## 1.3 UI changes

- `ThemeMasterPipeline.tsx` dropdown becomes a 2-level picker (vertical → subcategory) with search.
- Seller-facing onboarding `StepCategory` shares the same taxonomy → store gets tagged → marketplace filter "themes for jewellery sellers" works.

## 1.4 Cost protection

Pre-seed `theme_image_pool` with 3 images per vertical (~₹150 one-time) so the 2nd theme in any vertical is the ₹0.50 path.

---

# Phase 2 — Service Providers (the real unlock)

The fundamental shift: today every theme = "products to buy". We add a sibling concept: **`business_mode`** with two values — `product` (current) and `service` (new). Eventually maybe `hybrid` (yoga studio sells classes + mats).

## 2.1 New service verticals + offerings

```
Healthcare        doctor-general, dentist, pediatrician, gynaec, dermatologist,
                  physiotherapist, dietician, mental-health, ayurveda-clinic,
                  homeopathy, vet, diagnostic-lab, vaccination-centre

Legal & Finance   lawyer, CA, CS, tax-consultant, financial-advisor,
                  insurance-agent, loan-consultant

Education         tutor-1on1, coaching-institute, music-teacher, dance-teacher,
                  language-classes, online-courses, hobby-classes, school

Creative / Author author, journalist, photographer, videographer, designer,
                  illustrator, artist, musician, podcaster, content-creator

Wellness          yoga-instructor, personal-trainer, nutritionist,
                  meditation-coach, life-coach, spa, salon

Home Services     plumber, electrician, carpenter, painter, cleaning,
                  pest-control, AC-repair, interior-designer, architect

Events            wedding-planner, photographer-events, caterer, decorator,
                  band-DJ, venue, makeup-artist

Professional      consultant, freelancer-dev, marketing-agency, accountant,
                  HR-recruiter, business-coach, real-estate-agent

Travel & Hosp.    tour-operator, travel-agent, homestay, hotel, restaurant,
                  cafe, cloud-kitchen, food-truck

Auto Services     car-service-garage, bike-service, car-wash, driving-school
```

~10 verticals, ~80 offerings.

## 2.2 New section types (service-mode primitives)

Add to the generator's section enum:

| Section | Purpose |
|---|---|
| `service_list` | Replaces `featured_products` — cards showing service name, duration, price, "Book" CTA |
| `appointment_booking` | Calendar/slot picker; integrates with availability rules |
| `consultation_cta` | Hero CTA: "Book free 15-min consult" |
| `pricing_table` | Tiered packages (OPD ₹500 / Comprehensive ₹2000) |
| `credentials` | Degrees, certifications, registrations (MCI no., bar council) |
| `case_studies` | Before/after, testimonials with outcome |
| `portfolio_gallery` | Authors' books, photographers' shoots, architects' projects |
| `team_members` | Multi-doctor clinic, partners at a law firm |
| `clinic_hours` | Day/time grid |
| `service_areas` | Pincode coverage (plumber, doctor home-visit) |
| `faq_block` | Already exists — promote it |
| `intake_form` | Custom questions before booking (symptoms, case type) |
| `book_excerpt` / `media_mentions` | Author/creator credibility |

## 2.3 Data model additions

- `stores.business_mode` enum (`product` | `service` | `hybrid`).
- New tables: `services` (id, store_id, name, description, duration_min, price, prep_instructions, mode[in-person/online/home-visit]), `appointments`, `availability_rules`, `service_categories`.
- Existing `products` table stays — `hybrid` stores use both.
- `orders` extended with `order_type` (`goods` | `appointment`).

## 2.4 Booking flow (MVP)

1. Customer picks service → date/time → fills intake → pays (or pay-at-clinic).
2. Reuses Razorpay + COD plumbing already built.
3. Email + WhatsApp confirmation via existing notification edge functions (new templates).
4. Provider dashboard gets new "Today's Appointments" widget alongside "Today's Orders".

## 2.5 Shiprocket / shipping

Skipped for service mode. `ShippingSettings` becomes conditional — service-only stores see "Service Delivery Settings" (in-person address, home-visit radius, online meeting link) instead.

## 2.6 Generator changes

Same two-tier flow, but when `business_mode=service`:
- Section enum swaps commerce sections for service primitives.
- Image prompts skew to "professional portrait, clinic interior, courtroom desk, author at desk".
- DNA prompt prepended with: *"This is a SERVICE business. Do not generate 'Shop' language. Use 'Book', 'Consult', 'Schedule'."*
- Default section_order: `[announcement_bar, hero, consultation_cta, service_list, credentials, testimonials, faq_block, contact_form]`.

## 2.7 Onboarding fork

`StepCategory` first asks: **"What do you offer?"** → [Physical products / Services / Both]. That sets `business_mode` and surfaces the right vertical list. Everything downstream (theme generator, dashboard widgets, menu items) reads `business_mode`.

---

# Rollout sequence

```
Week 1   Phase 1.1–1.2  Taxonomy table + category brief table + seed data
Week 1   Phase 1.3      2-level picker UI (admin + onboarding)
Week 2   Phase 1.4      Image pool pre-seed script, cost test
Week 3   Phase 2.1–2.3  business_mode + services/appointments schema
Week 4   Phase 2.2,2.6  New service section types + generator service-mode prompt
Week 5   Phase 2.4      Booking flow end-to-end + notifications
Week 6   Phase 2.5,2.7  Conditional shipping screen + onboarding fork
Week 7   Beta with 10 service providers (doctor, lawyer, author, tutor, photographer)
```

---

# Technical Section

- `supabase/functions/generate-theme-pack/index.ts` — accept `{ vertical, subcategory, business_mode }`; load brief from `theme_category_briefs`; swap section enum based on mode; tweak DNA system prompt.
- New migrations: `theme_category_briefs`, `services`, `appointments`, `availability_rules`, `stores.business_mode`, `orders.order_type`.
- New blueprints in `theme_section_blueprints` for the 13 service section types (3 variants each ≈ 40 rows seeded).
- Renderer: extend `MasterThemeRenderer` + `src/themes/bazaar/sections/` with service section components.
- `StepCategory.tsx` — mode fork + 2-level picker.
- `ShippingSettings.tsx` — conditional render on `business_mode`.
- `Dashboard.tsx` — appointment widget for service stores.
- Storefront: new routes `/services`, `/services/:slug`, `/book/:serviceId`.

---

# Open questions before I build

1. **Booking payment** — pay full upfront, pay deposit, or pay-at-venue default? (Doctors usually pay-at-clinic; coaches usually upfront.)
2. **Calendar source of truth** — build native availability rules, or integrate Google Calendar from day one?
3. **WhatsApp confirmations** — use existing email pipe only, or wire WhatsApp Business API now (extra cost, big trust win for Indian users)?
4. **Hybrid mode in v1** — ship it, or service-only first and add hybrid later?
