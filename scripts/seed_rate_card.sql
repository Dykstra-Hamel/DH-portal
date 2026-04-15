-- ============================================================
-- DH Portal — Field Rate Card & Attic/Crawl Space Seed Data
-- Source: Field Rate Card v1.1
--         NW Ext Attic & Crawl Space Pricing (AZ)
--
-- INSTRUCTIONS:
--   1. Find your company UUID:
--        SELECT id, name FROM companies;
--   2. Replace 'YOUR-COMPANY-UUID-HERE' on the line below.
--   3. Run this script in the Supabase SQL editor.
--
-- INTERVAL SETTINGS NOTE:
--   The 4 pest-control service plans use home_size_pricing with
--   linear mode (+$0 initial / +$10 recurring per interval).
--   For the second tier (3500–5000 sqft) to price correctly, your
--   Company Pricing Settings should have:
--       base_home_sq_ft    = 3500
--       home_sq_ft_interval = 1500
--
--   The mosquito plan uses yard_size_pricing (+$100 initial /
--   +$25 recurring per interval). Set:
--       base_yard_acres    = 0.50
--       yard_acres_interval = 0.50
--
--   Weed-service plans use home_size_pricing in CUSTOM mode with
--   three lot-size tiers (0–5k / 5k–10k / 10k–20k). This works
--   correctly only if home_sq_ft_interval = 5000. Because that
--   conflicts with the pest-control interval (1500 sqft), the
--   weed plans are loaded with the base price only and
--   requires_quote = false. Reps should override the price for
--   larger lots. Alternatively, you can set requires_quote = true
--   on the weed plans after importing.
-- ============================================================
--
-- Set your company UUID on the line below, then run the script.
-- (Only one place to change.)

SELECT set_config('seed.cid', '66666666-6666-6666-6666-666666666666', false);

-- ============================================================
-- SERVICE PLANS
-- ============================================================

-- ── Pest Control w/ SMART EZ Pay ─────────────────────────────
-- Bi-monthly: 0–3500 sqft $249 start / $49/mo
--             3500–5000 sqft same start / $59/mo  (+$10 per interval)

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, home_size_pricing, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bi-Monthly Pest Control w/ SMART',
  'Bi-monthly pest control with SMART monitoring technology. Includes 1 SMART Connect, 2 Mini detectors, and 2 Rodent boxes. 30-day follow-up included after initial service.',
  'premium',
  249.00, 49.00, 'monthly', 'bi-monthly',
  true,
  '{"pricing_mode":"linear","initial_cost_per_interval":0,"recurring_cost_per_interval":10}'::jsonb,
  true, 1,
  '["Includes SMART monitoring system (1 Connect + 2 Minis + 2 Rodent boxes)","Bi-monthly treatments","30-day follow-up after start","Interior and exterior treatment"]'::jsonb
);

-- Quarterly: 0–3500 sqft $249 start / $45/mo
--            3500–5000 sqft same start / $55/mo  (+$10 per interval)

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, home_size_pricing, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Quarterly Pest Control w/ SMART',
  'Quarterly pest control with SMART monitoring technology. Includes 1 SMART Connect, 2 Mini detectors, and 2 Rodent boxes. 30-day follow-up included after initial service.',
  'premium',
  249.00, 45.00, 'monthly', 'quarterly',
  true,
  '{"pricing_mode":"linear","initial_cost_per_interval":0,"recurring_cost_per_interval":10}'::jsonb,
  true, 2,
  '["Includes SMART monitoring system (1 Connect + 2 Minis + 2 Rodent boxes)","Quarterly treatments","30-day follow-up after start","Interior and exterior treatment"]'::jsonb
);

-- ── Pest Control w/o SMART EZ Pay ────────────────────────────
-- Bi-monthly: 0–3500 sqft $199 start / $39/mo
--             3500–5000 sqft same start / $49/mo  (+$10 per interval)

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, home_size_pricing, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bi-Monthly Pest Control',
  'Bi-monthly pest control service. 30-day follow-up included after initial service. Interior and exterior treatment.',
  'standard',
  199.00, 39.00, 'monthly', 'bi-monthly',
  true,
  '{"pricing_mode":"linear","initial_cost_per_interval":0,"recurring_cost_per_interval":10}'::jsonb,
  true, 3,
  '["Bi-monthly treatments","30-day follow-up after start","Interior and exterior treatment"]'::jsonb
);

-- Quarterly: 0–3500 sqft $199 start / $35/mo
--            3500–5000 sqft same start / $45/mo  (+$10 per interval)

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, home_size_pricing, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Quarterly Pest Control',
  'Quarterly pest control service. 30-day follow-up included after initial service. Interior and exterior treatment.',
  'basic',
  199.00, 35.00, 'monthly', 'quarterly',
  true,
  '{"pricing_mode":"linear","initial_cost_per_interval":0,"recurring_cost_per_interval":10}'::jsonb,
  true, 4,
  '["Quarterly treatments","30-day follow-up after start","Interior and exterior treatment"]'::jsonb
);

-- ── Mosquito Service (EZ Pay / Paid in Full) ──────────────────
-- Up to 1/2 acre: $99 start / $50/mo
-- 1/2–1 acre:    $199 start / $75/mo  (+$100 initial, +$25/mo per interval)
-- 1+ acre: requires manager quote

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, yard_size_pricing, requires_quote, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Mosquito Control (Recurring)',
  'Seasonal mosquito control — 8 monthly back-to-back treatments. Start fee charged at time of first service. EZ Pay or paid in full at signing. Properties over 1 acre require manager quote.',
  'standard',
  99.00, 50.00, 'monthly', 'monthly',
  false,
  '{"pricing_mode":"linear","initial_cost_per_interval":100,"recurring_cost_per_interval":25}'::jsonb,
  false, true, 5,
  '["8-month seasonal program","Monthly treatments","Up to 1/2 acre at base price","1/2 to 1 acre pricing available","Properties over 1 acre — call manager for quote"]'::jsonb
);

-- ── Rodent Control Monitoring (EZ Pay only) ───────────────────
-- $199 start / $29/mo — includes 1 SMART Connect + 2 Minis

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Rodent Control Monitoring',
  'Rodent monitoring with SMART technology. EZ Pay only. Includes 1 SMART Connect and 2 Mini detectors. Add rodent bait stations as needed.',
  'standard',
  199.00, 29.00, 'monthly', 'monthly',
  false,
  true, 6,
  '["Includes 1 SMART Connect + 2 Mini detectors","Continuous rodent monitoring","EZ Pay required","Add bait stations or den removal as needed"]'::jsonb
);

-- ── Weed Control (Paid in Full) ───────────────────────────────
-- One Time (30-day warranty):  0–5k=$175 | 5k–10k=$275 | 10k–20k=$375 | 20k+=call
-- Semi-Annual (Full warranty): 0–5k=$475 | 5k–10k=$575 | 10k–20k=$675 | 20k+=call
--
-- custom_initial_prices array maps to your sqft intervals.
-- These plans are loaded at the base (0–5k) price.
-- The custom array only activates if your home_sq_ft_interval = 5000.
-- Reps should override the price for larger lots, or set requires_quote = true.

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency,
  includes_inspection, home_size_pricing, requires_quote, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Weed Control — Single Application',
  'One-time weed control treatment with 30-day warranty. Paid in full. Lot sizes over 20,000 sqft require manager quote.',
  'one-time',
  175.00, NULL, NULL,
  false,
  '{"pricing_mode":"custom","initial_cost_per_interval":0,"recurring_cost_per_interval":0,"custom_initial_prices":[175,275,375],"custom_recurring_prices":[0,0,0]}'::jsonb,
  false, true, 7,
  '["30-day warranty","Single treatment","0–5,000 sqft: $175","5,001–10,000 sqft: $275","10,001–20,000 sqft: $375","20,000+ sqft — call manager"]'::jsonb
);

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency,
  includes_inspection, home_size_pricing, requires_quote, is_active, display_order,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Weed Control — Semi-Annual Package',
  'Two weed control treatments per year (semi-annual). Full warranty. Paid in full. Lot sizes over 20,000 sqft require manager quote.',
  'one-time',
  475.00, NULL, NULL,
  false,
  '{"pricing_mode":"custom","initial_cost_per_interval":0,"recurring_cost_per_interval":0,"custom_initial_prices":[475,575,675],"custom_recurring_prices":[0,0,0]}'::jsonb,
  false, true, 8,
  '["Full warranty","2 applications per year","0–5,000 sqft: $475","5,001–10,000 sqft: $575","10,001–20,000 sqft: $675","20,000+ sqft — call manager"]'::jsonb
);


-- ============================================================
-- ADD-ON SERVICES
-- ============================================================

-- ── SMART Equipment ──────────────────────────────────────────
-- $75/unit setup. Bi-monthly: +$10/unit/mo. Quarterly: +$15/unit/mo.
-- pricing_type=per_room: first unit = initial_price, each add'l = additional_unit_price.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Additional SMART Equipment (Bi-Monthly)',
  'Additional SMART monitoring unit for bi-monthly plans. $75 per unit setup, $10/month per unit added to recurring billing.',
  'specialty',
  75.00, 10.00, 'monthly',
  'per_room', 75.00,
  true, false, 10
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Additional SMART Equipment (Quarterly)',
  'Additional SMART monitoring unit for quarterly plans. $75 per unit setup, $15/month per unit added to recurring billing.',
  'specialty',
  75.00, 15.00, 'monthly',
  'per_room', 75.00,
  true, false, 11
);

-- ── Mosquito Add-Ons ──────────────────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Into Care Mosquito Trap',
  'Mosquito In-to-Care trap. $75 per trap setup fee. $25/month per trap for ongoing maintenance and monitoring.',
  'specialty',
  75.00, 25.00, 'monthly',
  'flat',
  true, false, 12
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Mosquito Fogger (Portable)',
  'Portable mosquito fogger add-on. Starting at $199 for up to 1/2 acre. One-time per-service charge. Paid in full.',
  'basic',
  199.00, 0.00, NULL,
  'flat',
  true, false, 13
);

-- Truck mounted fogger: $350 up to 5 acres / $100 per acre over 5 — requires quote for large properties

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Truck Mounted Fogger',
  'Truck-mounted mosquito fogger. $350 for up to 5 acres. $100 per additional acre over 5. Large properties require manager quote.',
  'specialty',
  350.00, 0.00, NULL,
  'flat',
  true, true, 14,
  '$350 covers up to 5 acres. Add $100 per acre beyond 5. Confirm final price with manager.'
);

-- ── Rodent Add-Ons ────────────────────────────────────────────

-- Bait stations: $30/box setup + $5/box/service. Use per_room so rep enters box count.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Rodent Bait Stations',
  'Rodent bait station installation and monitoring. $30 per box setup, $5 per box per service visit. Enter number of boxes as quantity.',
  'basic',
  30.00, 5.00, 'monthly',
  'per_room', 30.00,
  true, false, 15
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Rodent Den Removal — Small',
  'Rodent den removal, small size. Starting at $150. Paid in full.',
  'specialty',
  150.00, 0.00, NULL,
  'flat',
  true, false, 16
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Rodent Den Removal — Large',
  'Rodent den removal, large size. Starting at $275. Paid in full.',
  'specialty',
  275.00, 0.00, NULL,
  'flat',
  true, false, 17
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Rodent Trapping',
  'Rodent trapping program. $450 includes initial service + 4 weekly follow-up visits (5 total visits). Paid in full.',
  'specialty',
  450.00, 0.00, NULL,
  'flat',
  true, false, 18
);

-- ── One-Time Pest Treatments ──────────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'German Roach Clean Out',
  'German roach elimination with 1 follow-up included. $299 for first room, $125 for each additional room. Enter room count as quantity.',
  'specialty',
  299.00, 0.00, NULL,
  'per_room', 125.00,
  true, false, 20
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Carpet Beetle Treatment',
  'Carpet beetle treatment up to 1,000 sqft. Includes 1 follow-up at 30 days. $299 paid in full.',
  'basic',
  299.00, 0.00, NULL,
  'flat',
  true, false, 21
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Gnat Treatment',
  'Gnat treatment with 1 follow-up at 30 days. $299 paid in full.',
  'basic',
  299.00, 0.00, NULL,
  'flat',
  true, false, 22
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Tick & Flea Service',
  'Complete tick and flea treatment — full exterior and interior. Includes 30-day follow-up. Price range $450–$550 depending on property size.',
  'specialty',
  450.00, 0.00, NULL,
  'flat',
  true, false, 23,
  'Price range $450–$550. Confirm final price for larger or complex properties.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Gopher X Service',
  'Gopher X treatment with 30-day warranty on same mounds. $350 for up to 15 mounds; $25 per every 5 mounds over 15. Paid in full.',
  'specialty',
  350.00, 0.00, NULL,
  'flat',
  true, false, 24,
  '$350 covers up to 15 mounds. Add $25 per every 5 mounds over 15.'
);

-- Snake Away: $2.50/lnft — rep must calculate and override price

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Snake Away Treatment',
  'Snake Away barrier treatment. $2.50 per linear foot. 60-day warranty. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 25,
  '$2.50/lnft. Measure total linear footage and enter calculated price manually. 60-day warranty.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Scorpion Service',
  'Complete scorpion treatment. Includes enhanced J-Trim dusting, doorways, complete block wall dusting, and enhanced full yard treatment. Price range $450–$550.',
  'specialty',
  450.00, 0.00, NULL,
  'flat',
  true, false, 26,
  'Price range $450–$550. Confirm final price for larger or more complex properties.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Black Light Inspection (Add-On)',
  'Black light inspection add-on to Scorpion Service. Price range $175–$225.',
  'specialty',
  175.00, 0.00, NULL,
  'flat',
  true, false, 27,
  'Price range $175–$225. Confirm final price with manager.'
);

-- ── Fly Treatments ────────────────────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Fly Spot Treatment',
  'One-time fly spot treatment. $100 flat. Paid in full.',
  'basic',
  100.00, 0.00, NULL,
  'flat',
  true, false, 30
);

-- Drain treatment: $35 per drain — use per_room so rep enters drain count

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Fly Drain Treatment',
  'Fly drain treatment. $35 per drain. Enter number of drains as quantity.',
  'basic',
  35.00, 0.00, NULL,
  'per_room', 35.00,
  true, false, 31
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Fly Bag',
  'Fly bag. $20 each.',
  'basic',
  20.00, 0.00, NULL,
  'flat',
  true, false, 32
);

-- ── Weed Cleanup Charge ───────────────────────────────────────
-- $175/hr, minimum 2 hours ($350 minimum)

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Weed Cleanup Charge',
  'Additional cleanup labor for weed service (e.g. wood or construction debris). $175 per hour. Minimum 2 hours.',
  'basic',
  175.00, 0.00, NULL,
  'per_hour', 350.00,
  true, false, 33,
  'Minimum 2 hours ($350 minimum). Billed at $175/hr.'
);

-- ── Bed Bug ───────────────────────────────────────────────────
-- Conventional: $699 min (1 room, no warranty) or $1.25/sqft multi-room
-- Thermal: $1,800 min or $2.25/sqft

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bed Bug Conventional Treatment',
  'Conventional bed bug treatment. $699 minimum covers one room (NO warranty). $1.25/sqft for multi-room coverage. Add mattress encasements per bed + full treatment for 90-day warranty. Jobs outside city limits add $150. Weekend service add $250.',
  'specialty',
  699.00, 0.00, NULL,
  'flat', 699.00,
  true, false, 40,
  '$699 = one room only, no warranty. Multi-room: $1.25/sqft (calculate and override). Full treatment + encasements per bed = 90-day warranty.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bed Bug Thermal Treatment',
  'Thermal bed bug treatment. $1,800 minimum or $2.25/sqft. Jobs outside city limits add $150. Weekend service add $250.',
  'specialty',
  1800.00, 0.00, NULL,
  'flat', 1800.00,
  true, true, 41,
  '$1,800 minimum. $2.25/sqft for larger properties. Confirm final price with manager.'
);

-- Mattress encasements — variants by size

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, variants,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Mattress Encasement',
  'Mattress and box spring encasement sold separately. Select size below. Recommended with full bed bug treatment for 90-day warranty.',
  'specialty',
  65.00, 0.00, NULL,
  'flat',
  '[{"label":"Twin","initial_price":65},{"label":"Full","initial_price":85},{"label":"Queen","initial_price":100},{"label":"King","initial_price":115}]'::jsonb,
  true, false, 42
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Power Dusting of Crawl Space',
  'Power dusting treatment of crawl space. $79 flat.',
  'basic',
  79.00, 0.00, NULL,
  'flat',
  true, false, 43
);

-- ── Bird Work ─────────────────────────────────────────────────
-- Note: All roof work requires adding the $500 Roof Anchor System add-on.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bird Spike Installation',
  'Bird spike installation. $8.00 per linear foot. All roof work requires +$500 anchor system add-on. 2-story properties add $125 for second technician.',
  'specialty',
  0.00, 0.00, NULL,
  'per_linear_foot', 8.00, NULL,
  true, false, 50,
  'Add Roof Anchor System ($500) for all roof work. 2-story: add $125.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bird Wire Installation',
  'Bird wire installation. $12.00 per linear foot. All roof work requires +$500 anchor system add-on.',
  'specialty',
  0.00, 0.00, NULL,
  'per_linear_foot', 12.00, NULL,
  true, false, 51,
  'Add Roof Anchor System ($500) for all roof work.'
);

-- Solar kit: $250 per 50 lnft, $500 min. 2-story: +$125.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, minimum_price,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Solar Panel Bird Kit',
  'Solar panel bird exclusion kit. $250 per 50 linear feet, $500 minimum. 2-story properties add $125 for second technician. If a lift is needed call manager.',
  'specialty',
  500.00, 0.00, NULL,
  'flat', 500.00,
  true, false, 52,
  '$250 per 50 lnft. Minimum $500. 2-story: add $125. Lift required: call manager.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Roof Anchor System',
  'Safety anchor system required for all bird work performed on roofs. $500 flat. Add to any bird spike, wire, or solar kit quote when work is on the roof.',
  'specialty',
  500.00, 0.00, NULL,
  'flat',
  true, false, 53
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Owl Cove — Small (up to 2×3)',
  'Owl cove installation using hardware cloth. Up to 2×3 ft. $275 flat.',
  'specialty',
  275.00, 0.00, NULL,
  'flat',
  true, false, 54
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Owl Cove — Large (up to 5×5)',
  'Owl cove installation using hardware cloth. Up to 5×5 ft. $325 flat.',
  'specialty',
  325.00, 0.00, NULL,
  'flat',
  true, false, 55
);

-- Bird cleanup: $175/hr, $250 minimum

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bird Cleanup',
  'Bird debris cleanup. $175 per hour, $250 minimum.',
  'specialty',
  175.00, 0.00, NULL,
  'per_hour', 250.00,
  true, false, 56
);

-- Bird warranty — percentage pricing

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bird Work Warranty — 1 Year',
  '1-year bird work warranty. Priced at 20% of original job cost. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":20,"years":1}'::jsonb,
  true, false, 57
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bird Work Warranty — 5 Year',
  '5-year extended bird work warranty. Priced at 15% of job cost × 5 years. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":15,"years":5}'::jsonb,
  true, false, 58
);

-- ── Exclusion Services ────────────────────────────────────────
-- J-Trim: $6/lnft, $300 min
-- Complete Guard: $12.50–$15/lnft (requires quote — use manager pricing calculator)
-- Door sweeps: $125 single / $325 bundle of 3
-- Warranty: 1yr = 20% of job cost, 5yr = 15% × 5

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'J-Trim Seal',
  'J-trim seal exclusion. $3.50 per linear foot, $300 minimum. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'per_linear_foot', 3.50, 300.00,
  true, false, 60
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Complete Guard Package',
  'Complete exclusion package. $12.50–$15.00 per linear foot. Includes j-trim, piping, roof vents, and roof lines. Does NOT include garage door. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 61,
  '$12.50–$15.00/lnft. Use pricing calculator or call manager. Does not include garage door.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Door Sweep — Single',
  'Door sweep installation for 36"–48" door. $125 each.',
  'basic',
  125.00, 0.00, NULL,
  'flat',
  true, false, 62
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Door Sweep — Bundle (3×)',
  'Bundle of 3 door sweep installations for 36"–48" doors. $325 for 3 doors.',
  'basic',
  325.00, 0.00, NULL,
  'flat',
  true, false, 63
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Exclusion Warranty — 1 Year',
  '1-year exclusion warranty. Priced at 20% of original job cost. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":20,"years":1}'::jsonb,
  true, false, 64
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Exclusion Warranty — 5 Year',
  '5-year extended exclusion warranty. Priced at 15% of job cost × 5 years. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":15,"years":5}'::jsonb,
  true, false, 65
);

-- ── Termite ───────────────────────────────────────────────────
-- Sentricon: Preventative $6/lnft | Corrective $8/lnft
-- Liquid:    Preventative $9/lnft | Corrective $12/lnft
-- Conversion (Liquid→Sentricon): $5/lnft
-- Double Wrap (Liquid + Sentricon): $14/lnft
-- Rep measures linear feet and overrides price in quote builder.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite Sentricon — Preventative',
  'Sentricon bait system — preventative installation. $6.00 per linear foot. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 70,
  '$6.00/lnft. Measure total linear footage of foundation and enter calculated price manually.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite Sentricon — Corrective',
  'Sentricon bait system — corrective treatment. $8.00 per linear foot. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 71,
  '$8.00/lnft. Measure total linear footage and enter calculated price manually.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite Liquid Treatment — Preventative',
  'Liquid termite treatment (trench & drill) — preventative. $9.00 per linear foot. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 72,
  '$9.00/lnft. Measure total linear footage and enter calculated price manually.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite Liquid Treatment — Corrective',
  'Liquid termite treatment (trench & drill) — corrective. $12.00 per linear foot. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 73,
  '$12.00/lnft. Measure total linear footage and enter calculated price manually.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite — Liquid to Sentricon Conversion',
  'Convert existing liquid termite treatment to Sentricon bait system. $5.00 per linear foot. Paid in full. Warranty follows Sentricon rates after conversion.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 74,
  '$5.00/lnft. Warranty follows Sentricon rate.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Termite — Double Wrap (Liquid + Sentricon)',
  'Combined liquid and Sentricon termite treatment. $14.00 per linear foot. Sentricon is the primary service for warranty purposes. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  true, true, 75,
  '$14.00/lnft. Sentricon warranty applies.'
);

-- Termite warranties — percentage pricing
-- Sentricon: 1yr = 20% min $250 | 5yr = 15% × 5
-- Liquid:    1yr = 22% min $300 | 5yr = 18% × 5

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Sentricon Warranty — 1 Year Renewal',
  'Annual Sentricon warranty renewal. 20% of original job cost, $250 minimum. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":20,"years":1,"minimum":250}'::jsonb, 250.00,
  true, false, 76
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Sentricon Warranty — 5 Year Extended',
  '5-year extended Sentricon warranty. 15% of job cost × 5 years. Paid in full. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":15,"years":5}'::jsonb,
  true, false, 77
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Liquid Termite Warranty — 1 Year Renewal',
  'Annual liquid termite warranty renewal. 22% of original job cost, $300 minimum. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":22,"years":1,"minimum":300}'::jsonb, 300.00,
  true, false, 78
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, percentage_pricing,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Liquid Termite Warranty — 5 Year Extended',
  '5-year extended liquid termite warranty. 18% of job cost × 5 years. Paid in full. Enter job total to calculate.',
  'specialty',
  0.00, 0.00, NULL,
  'flat',
  '{"percentage":18,"years":5}'::jsonb,
  true, false, 79
);

-- Bora-Care: no fixed public rate — requires manager quote

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bora-Care Treatment',
  'Bora-Care termite and wood-destroying organism treatment. Priced per square foot of treated area. Requires manager quote. Paid in full.',
  'specialty',
  0.00, 0.00, NULL,
  'per_sqft',
  true, true, 80,
  'Rate varies — requires manager quote. Enter approved price manually in quote builder.'
);

-- ── Bee Service ───────────────────────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bee Removal (Ground to 10 ft)',
  'Bee hive removal — accessible from ground to 10 feet. $225 flat. If lift is needed call manager.',
  'specialty',
  225.00, 0.00, NULL,
  'flat',
  true, false, 85
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bee Removal (10 to 20 ft)',
  'Bee hive removal — 10 to 20 feet high. $350 flat. If lift is needed call manager.',
  'specialty',
  350.00, 0.00, NULL,
  'flat',
  true, false, 86
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bee Comb Removal (Ground to 10 ft)',
  'Bee comb removal from ground level to 10 feet. $175 per hour. Enter hours as quantity.',
  'specialty',
  175.00, 0.00, NULL,
  'per_hour',
  true, false, 87
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Bee Comb Removal (10 to 20 ft)',
  'Bee comb removal from 10 to 20 feet high. $225 per hour. Enter hours as quantity.',
  'specialty',
  225.00, 0.00, NULL,
  'per_hour',
  true, false, 88
);

-- ── Attic Clean-Out & Insulation Service Plans ────────────────
-- Full service plans priced per sqft. Formula: sqft × rate, $2,400 minimum.
-- Blown in: $4.70/sqft | Blown & Rolled: $5.30/sqft
-- Topper on existing insulation: variants by R-value depth, base $2.60/sqft
-- Insulation removal only: $2.20/sqft

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Attic Clean Out — Blown In',
  'Full attic clean out — blown-in insulation only. Includes insulation removal, disinfecting, and TAP insulation blow-back at 10.5". Priced at $4.70/sqft with a $2,400 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  true, true, 20,
  'sqft', 4.70, 2400.00,
  '["Insulation removal","Disinfecting","TAP insulation blow-back at 10.5\"","$2,400 minimum"]'::jsonb
);

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Attic Clean Out — Blown & Rolled',
  'Full attic clean out — blown and/or rolled insulation. Includes insulation removal, disinfecting, and TAP insulation blow-back at 10.5". Priced at $5.30/sqft with a $2,400 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  true, true, 21,
  'sqft', 5.30, 2400.00,
  '["Insulation removal (blown & rolled)","Disinfecting","TAP insulation blow-back at 10.5\"","$2,400 minimum"]'::jsonb
);

-- Topper — variants by R-value depth; base price_per_unit = 2.60 (R-19).
-- Selecting a variant in the quote builder uses that variant's price_per_unit.

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  variants, plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Attic Insulation Topper',
  'Blown-in TAP insulation added over existing insulation — no removal or disinfecting. Priced per sqft based on R-value depth selected. $2,400 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  false, true, 22,
  'sqft', 2.60, 2400.00,
  '[{"label":"6\" (R-19)","price_per_unit":2.60},{"label":"8\" (R-30)","price_per_unit":3.00},{"label":"10.5\" (R-38)","price_per_unit":3.10},{"label":"13\" (R-49)","price_per_unit":3.30}]'::jsonb,
  '["No removal or disinfecting","TAP insulation blow-back","Select R-value depth","$2,400 minimum"]'::jsonb
);

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Attic Insulation Removal Only',
  'Attic insulation removal and sanitizing only — no reinstall. Priced at $2.20/sqft with a $2,400 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  true, true, 23,
  'sqft', 2.20, 2400.00,
  '["Insulation removal","Sanitizing","No reinstall included","$2,400 minimum"]'::jsonb
);

-- ── Crawl Space / Sub-Area Service Plans ──────────────────────
-- Full service plans priced per sqft. $1,900 minimum.

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Crawl Space — Insulation Removal',
  'Crawl/sub-area insulation removal. Includes vacuuming and disinfecting. $2.70/sqft, $1,900 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  true, true, 30,
  'sqft', 2.70, 1900.00,
  '["Insulation removal","Vacuuming","Disinfecting","$1,900 minimum"]'::jsonb
);

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Crawl Space — Insulation Removal + Install',
  'Crawl/sub-area insulation removal and new installation. Includes vacuuming and disinfecting. $5.40/sqft, $1,900 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  true, true, 31,
  'sqft', 5.40, 1900.00,
  '["Insulation removal","Vacuuming","Disinfecting","New insulation install","$1,900 minimum"]'::jsonb
);

INSERT INTO service_plans (
  company_id, plan_name, plan_description, plan_category,
  initial_price, recurring_price, billing_frequency, treatment_frequency,
  includes_inspection, is_active, display_order,
  pricing_unit, price_per_unit, minimum_price,
  plan_features
) VALUES (
  current_setting('seed.cid')::UUID,
  'Crawl Space — Vacuum Cleanup Only',
  'Crawl/sub-area vacuum cleanup only. $1.80/sqft, $1,900 minimum.',
  'one-time',
  0.00, NULL, NULL, 'on-demand',
  false, true, 32,
  'sqft', 1.80, 1900.00,
  '["Vacuum cleanup only","$1,900 minimum"]'::jsonb
);

-- ── Attic/Crawl Add-On Services ───────────────────────────────
-- These are add-ons to a clean-out service plan, not standalone plans.

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Vapor Barrier — Removal, Vacuum & Disinfect',
  'Vapor barrier removal with vacuuming and disinfecting. $2.20/sqft, $1,900 minimum.',
  'specialty',
  0.00, 0.00, NULL,
  'per_sqft', 2.20, 1900.00,
  true, false, 103
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Vapor Barrier — Install Only',
  'New vapor barrier installation only. $1.50/sqft, $1,900 minimum.',
  'specialty',
  0.00, 0.00, NULL,
  'per_sqft', 1.50, 1900.00,
  true, false, 104
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit, minimum_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Vapor Barrier — Full Service (Remove + Disinfect + Install)',
  'Complete vapor barrier service: removal, vacuuming, disinfecting, and new installation. $3.50/sqft, $1,900 minimum.',
  'specialty',
  0.00, 0.00, NULL,
  'per_sqft', 3.50, 1900.00,
  true, false, 105
);

-- ── Attic/Crawl Add-On Services ───────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, price_per_unit,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Attic / Crawl Space Exclusion',
  'Exclusion services added to a full attic or crawl space clean out. $0.60/sqft. Only add alongside a full Quality Pest clean out. For standalone exclusion use the NW Desert Guard pricing calculator.',
  'specialty',
  0.00, 0.00, NULL,
  'per_sqft', 0.60,
  true, false, 106,
  'Must be added alongside a full clean-out job.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  '30-Watt Attic Solar Fan',
  '30-watt solar-powered attic fan installation. $1,500 flat.',
  'specialty',
  1500.00, 0.00, NULL,
  'flat',
  true, false, 107
);

-- Man-door sweep: $70/door — use per_room so rep enters door count

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Man-Door Door Sweep',
  'Door sweep for man-door. $70 per door. Enter number of doors as quantity.',
  'basic',
  70.00, 0.00, NULL,
  'per_room', 70.00,
  true, false, 108
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  '1-Car Garage Door Seal',
  'Garage door seal for 1-car garage. $400 per door.',
  'basic',
  400.00, 0.00, NULL,
  'flat',
  true, false, 109
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  '2-Car Garage Door Seal',
  'Garage door seal for 2-car garage. $600 per door.',
  'basic',
  600.00, 0.00, NULL,
  'flat',
  true, false, 110
);

-- HVAC duct cleaning: $2,800 per A/C unit — use per_room for multiple units

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type, additional_unit_price,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'HVAC Duct Cleaning',
  'HVAC duct cleaning. $2,800 per A/C unit. Enter number of units as quantity.',
  'specialty',
  2800.00, 0.00, NULL,
  'per_room', 2800.00,
  true, false, 111
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Dryer Vent Cleaning',
  'Dryer vent cleaning service. $200 flat.',
  'basic',
  200.00, 0.00, NULL,
  'flat',
  true, false, 112
);

-- ── Logistics / Fees ──────────────────────────────────────────

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Trip Charge — Phoenix to Tucson',
  'Trip surcharge for service dispatched from Phoenix to the Tucson area. $650 flat.',
  'basic',
  650.00, 0.00, NULL,
  'flat',
  true, false, 120
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order,
  addon_disclaimer
) VALUES (
  current_setting('seed.cid')::UUID,
  'Delay Charge',
  'Technician delay charge. $79 per hour per technician. Enter total technician-hours as quantity.',
  'basic',
  79.00, 0.00, NULL,
  'per_hour',
  true, false, 121,
  '$79/hr per technician. If multiple technicians are delayed, multiply hours × number of techs.'
);

INSERT INTO add_on_services (
  company_id, addon_name, addon_description, addon_category,
  initial_price, recurring_price, billing_frequency,
  pricing_type,
  is_active, requires_quote, display_order
) VALUES (
  current_setting('seed.cid')::UUID,
  'Dead Trip Charge',
  'Dead trip charge — technician arrives but cannot perform service. $350 flat.',
  'basic',
  350.00, 0.00, NULL,
  'flat',
  true, false, 122
);

