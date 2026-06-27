CREATE TYPE "EventCategoryStatus" AS ENUM (
  'active',
  'hidden',
  'archived'
);

CREATE TYPE "PackageStatus" AS ENUM (
  'active',
  'inactive',
  'hidden',
  'archived'
);

CREATE TABLE "event_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "cover_image_url" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "status" "EventCategoryStatus" NOT NULL DEFAULT 'active',
  "client_visible" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "packages" (
  "id" TEXT NOT NULL,
  "event_category_id" TEXT NOT NULL,
  "package_name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'PHP',
  "pax_included" INTEGER NOT NULL DEFAULT 0,
  "excess_pax_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservation_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "down_payment_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "full_payment_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "check_in_time" TEXT,
  "check_out_time" TEXT,
  "package_image_url" TEXT,
  "contract_item_description" TEXT,
  "contract_inclusion_description" TEXT,
  "status" "PackageStatus" NOT NULL DEFAULT 'active',
  "client_visible" BOOLEAN NOT NULL DEFAULT true,
  "current_version" INTEGER NOT NULL DEFAULT 1,
  "internal_notes" TEXT,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "package_inclusions" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "inclusion_name" TEXT NOT NULL,
  "description" TEXT,
  "is_free" BOOLEAN NOT NULL DEFAULT true,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "package_inclusions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "package_versions" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "snapshot_data" JSONB NOT NULL,
  "change_summary" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "package_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_package_snapshots" (
  "id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "event_category_id" TEXT,
  "package_id" TEXT,
  "package_version" INTEGER NOT NULL,
  "snapshot_data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_package_snapshots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bookings"
  ADD COLUMN "event_category_id" TEXT,
  ADD COLUMN "event_category_name" TEXT,
  ADD COLUMN "package_id" TEXT,
  ADD COLUMN "package_version" INTEGER;

CREATE UNIQUE INDEX "event_categories_slug_key" ON "event_categories"("slug");
CREATE INDEX "event_categories_status_idx" ON "event_categories"("status");
CREATE INDEX "event_categories_client_visible_idx" ON "event_categories"("client_visible");
CREATE INDEX "event_categories_display_order_idx" ON "event_categories"("display_order");
CREATE INDEX "event_categories_status_client_visible_idx" ON "event_categories"("status", "client_visible");

CREATE UNIQUE INDEX "packages_event_category_id_slug_key" ON "packages"("event_category_id", "slug");
CREATE INDEX "packages_event_category_id_idx" ON "packages"("event_category_id");
CREATE INDEX "packages_status_idx" ON "packages"("status");
CREATE INDEX "packages_client_visible_idx" ON "packages"("client_visible");
CREATE INDEX "packages_status_client_visible_idx" ON "packages"("status", "client_visible");
CREATE INDEX "packages_updated_at_idx" ON "packages"("updated_at");

CREATE INDEX "package_inclusions_package_id_idx" ON "package_inclusions"("package_id");
CREATE INDEX "package_inclusions_display_order_idx" ON "package_inclusions"("display_order");

CREATE UNIQUE INDEX "package_versions_package_id_version_number_key" ON "package_versions"("package_id", "version_number");
CREATE INDEX "package_versions_package_id_idx" ON "package_versions"("package_id");
CREATE INDEX "package_versions_created_at_idx" ON "package_versions"("created_at");

CREATE UNIQUE INDEX "booking_package_snapshots_booking_id_key" ON "booking_package_snapshots"("booking_id");
CREATE INDEX "booking_package_snapshots_booking_id_idx" ON "booking_package_snapshots"("booking_id");
CREATE INDEX "booking_package_snapshots_event_category_id_idx" ON "booking_package_snapshots"("event_category_id");
CREATE INDEX "booking_package_snapshots_package_id_idx" ON "booking_package_snapshots"("package_id");

CREATE INDEX "bookings_event_category_id_idx" ON "bookings"("event_category_id");
CREATE INDEX "bookings_package_id_idx" ON "bookings"("package_id");

ALTER TABLE "packages"
  ADD CONSTRAINT "packages_event_category_id_fkey"
  FOREIGN KEY ("event_category_id") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "package_inclusions"
  ADD CONSTRAINT "package_inclusions_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "package_versions"
  ADD CONSTRAINT "package_versions_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_event_category_id_fkey"
  FOREIGN KEY ("event_category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_package_snapshots"
  ADD CONSTRAINT "booking_package_snapshots_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_package_snapshots"
  ADD CONSTRAINT "booking_package_snapshots_event_category_id_fkey"
  FOREIGN KEY ("event_category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_package_snapshots"
  ADD CONSTRAINT "booking_package_snapshots_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "event_categories" (
  "id",
  "name",
  "slug",
  "description",
  "cover_image_url",
  "display_order",
  "status",
  "client_visible",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at"
) VALUES
  ('event-category-wedding-reception', 'Wedding Reception', 'wedding-reception', 'Elegant wedding receptions with curated venue, styling, dining, and coordination options.', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop', 10, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-debut', 'Debut', 'debut', 'Milestone debut celebrations styled with signature Zion elegance.', 'https://images.unsplash.com/photo-1549471013-3364d7220b75?q=80&w=2070&auto=format&fit=crop', 20, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-birthday', 'Birthday', 'birthday', 'Warm birthday gatherings and grand celebrations for every age.', 'https://images.unsplash.com/photo-1530103862676-de389de4b786?q=80&w=2070&auto=format&fit=crop', 30, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-christening', 'Christening', 'christening', 'Graceful christening receptions for family-centered celebrations.', 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=2070&auto=format&fit=crop', 40, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-gender-reveal', 'Gender Reveal', 'gender-reveal', 'Thoughtfully styled gender reveal moments with soft, photogenic details.', 'https://images.unsplash.com/photo-1621364531235-97b77ab6ef80?q=80&w=2070&auto=format&fit=crop', 50, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-christmas-party', 'Christmas Party', 'christmas-party', 'Festive seasonal celebrations for families, teams, and communities.', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', 60, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-anniversary', 'Anniversary', 'anniversary', 'Romantic and family anniversary celebrations with curated ambiance.', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop', 70, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-reunion', 'Reunion', 'reunion', 'Comfortable reunion packages for families, classmates, and organizations.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop', 80, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-corporate-event', 'Corporate Event', 'corporate-event', 'Professional event packages for meetings, launches, and team gatherings.', 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop', 90, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('event-category-custom-event', 'Custom Event', 'custom-event', 'Flexible event planning for celebrations that need a tailored package.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop', 100, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "packages" (
  "id",
  "event_category_id",
  "package_name",
  "slug",
  "description",
  "price",
  "currency",
  "pax_included",
  "excess_pax_fee",
  "reservation_fee",
  "down_payment_amount",
  "full_payment_amount",
  "check_in_time",
  "check_out_time",
  "package_image_url",
  "contract_item_description",
  "contract_inclusion_description",
  "status",
  "client_visible",
  "current_version",
  "internal_notes",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at"
) VALUES
  ('pkg-wedding-premium', 'event-category-wedding-reception', 'Zion Premium Package', 'zion-premium-package', 'The complete Zion wedding reception experience with premium styling, dining, coordination, and guest care.', 225000, 'PHP', 150, 950, 15000, 25000, 225000, '15:00', '20:00', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop', 'Wedding reception package for the booked event date, venue use, styling, food service, and coordination.', 'Premium package inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-wedding-classic', 'event-category-wedding-reception', 'Classic Wedding Package', 'classic-wedding-package', 'A refined wedding reception package for intimate and mid-sized gatherings.', 180000, 'PHP', 100, 850, 10000, 20000, 180000, '15:00', '20:00', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop', 'Classic wedding reception package for venue use, food service, and essential event support.', 'Classic package inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-wedding-garden', 'event-category-wedding-reception', 'Garden Wedding Package', 'garden-wedding-package', 'A garden-forward package with soft styling and an elegant outdoor mood.', 195000, 'PHP', 120, 900, 10000, 22000, 195000, '15:00', '20:00', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', 'Garden wedding reception package with venue use, garden styling, and core reception support.', 'Garden wedding inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-wedding-reception-only', 'event-category-wedding-reception', 'Reception Only Package', 'reception-only-package', 'A focused venue and reception package for clients with existing ceremony plans.', 150000, 'PHP', 80, 750, 10000, 15000, 150000, '16:00', '21:00', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop', 'Reception-only package for venue use and reception support.', 'Reception-only inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-debut-signature', 'event-category-debut', 'Signature Debut Package', 'signature-debut-package', 'A graceful debut package with venue, styling, program support, and celebration essentials.', 165000, 'PHP', 100, 750, 10000, 18000, 165000, '16:00', '21:00', 'https://images.unsplash.com/photo-1549471013-3364d7220b75?q=80&w=2070&auto=format&fit=crop', 'Debut event package for venue use, program support, styling, and dining service.', 'Debut inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-birthday-classic', 'event-category-birthday', 'Classic Birthday Package', 'classic-birthday-package', 'A festive birthday package with venue use, basic styling, and guest-ready amenities.', 95000, 'PHP', 70, 650, 8000, 12000, 95000, '14:00', '18:00', 'https://images.unsplash.com/photo-1530103862676-de389de4b786?q=80&w=2070&auto=format&fit=crop', 'Birthday event package for venue use, styling, and core event support.', 'Birthday inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-christening-family', 'event-category-christening', 'Family Christening Package', 'family-christening-package', 'A calm and elegant christening reception package for family gatherings.', 90000, 'PHP', 70, 650, 8000, 12000, 90000, '10:00', '14:00', 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=2070&auto=format&fit=crop', 'Christening reception package for venue use, guest seating, and dining service.', 'Christening inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-gender-reveal-soft', 'event-category-gender-reveal', 'Soft Reveal Package', 'soft-reveal-package', 'A photogenic gender reveal package with soft styling and reveal-ready setup.', 85000, 'PHP', 60, 600, 8000, 10000, 85000, '14:00', '18:00', 'https://images.unsplash.com/photo-1621364531235-97b77ab6ef80?q=80&w=2070&auto=format&fit=crop', 'Gender reveal event package for venue use, reveal setup, and core celebration support.', 'Gender reveal inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-christmas-classic', 'event-category-christmas-party', 'Classic Christmas Party Package', 'classic-christmas-party-package', 'A festive Christmas package for holiday gatherings with warm seasonal styling.', 125000, 'PHP', 100, 700, 10000, 15000, 125000, '18:00', '23:00', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', 'Christmas party package for venue use, seasonal styling, and dining service.', 'Christmas party inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-custom-zion', 'event-category-custom-event', 'Custom Zion Package', 'custom-zion-package', 'A flexible package baseline for custom celebrations and special event formats.', 100000, 'PHP', 60, 700, 10000, 15000, 100000, '15:00', '20:00', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop', 'Custom event package for venue use and agreed event services.', 'Custom event inclusions shall follow the booking package snapshot and confirmed add-ons.', 'active', true, 1, 'Initial seeded offer.', 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("event_category_id", "slug") DO NOTHING;

INSERT INTO "package_inclusions" (
  "id",
  "package_id",
  "inclusion_name",
  "description",
  "is_free",
  "is_optional",
  "display_order",
  "created_at",
  "updated_at"
) VALUES
  ('incl-wedding-premium-venue', 'pkg-wedding-premium', 'Venue use', 'Exclusive Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-premium-catering', 'pkg-wedding-premium', 'Catering', 'Curated dining service for included pax.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-premium-styling', 'pkg-wedding-premium', 'Premium styling', 'Premium tablescape, focal styling, and reception styling.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-premium-sounds', 'pkg-wedding-premium', 'Sound system', 'Event sound system for program flow and music.', true, false, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-premium-coordination', 'pkg-wedding-premium', 'OTD coordinators', 'On-the-day coordination support.', true, false, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-classic-venue', 'pkg-wedding-classic', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-classic-catering', 'pkg-wedding-classic', 'Catering', 'Dining service for included pax.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-classic-tables', 'pkg-wedding-classic', 'Tables and chairs', 'Guest tables and chairs for included pax.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-garden-venue', 'pkg-wedding-garden', 'Garden venue use', 'Garden-forward venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-garden-styling', 'pkg-wedding-garden', 'Garden styling', 'Soft garden styling and tablescape details.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-garden-catering', 'pkg-wedding-garden', 'Catering', 'Dining service for included pax.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-reception-venue', 'pkg-wedding-reception-only', 'Venue use', 'Reception venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-reception-tables', 'pkg-wedding-reception-only', 'Tables and chairs', 'Guest tables and chairs for included pax.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-wedding-reception-sounds', 'pkg-wedding-reception-only', 'Sound system', 'Event sound system for program flow.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-debut-venue', 'pkg-debut-signature', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-debut-styling', 'pkg-debut-signature', 'Debut styling', 'Debut focal styling and tablescape details.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-debut-host', 'pkg-debut-signature', 'Host', 'Program hosting support for the celebration.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-birthday-venue', 'pkg-birthday-classic', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-birthday-styling', 'pkg-birthday-classic', 'Birthday styling', 'Basic themed styling and table setup.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-birthday-sounds', 'pkg-birthday-classic', 'Sound system', 'Event sound system for program flow.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christening-venue', 'pkg-christening-family', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christening-catering', 'pkg-christening-family', 'Catering', 'Family reception dining service.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christening-registration', 'pkg-christening-family', 'Registration setup', 'Guest welcome and registration setup.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-gender-venue', 'pkg-gender-reveal-soft', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-gender-reveal', 'pkg-gender-reveal-soft', 'Reveal setup', 'Reveal-ready focal setup.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-gender-photobooth', 'pkg-gender-reveal-soft', 'Photobooth', 'Photobooth-ready styling zone.', false, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christmas-venue', 'pkg-christmas-classic', 'Venue use', 'Zion venue access within the package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christmas-styling', 'pkg-christmas-classic', 'Christmas styling', 'Seasonal styling for a warm holiday atmosphere.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-christmas-catering', 'pkg-christmas-classic', 'Catering', 'Holiday dining service for included pax.', true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-custom-venue', 'pkg-custom-zion', 'Venue use', 'Zion venue access within the agreed package schedule.', true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-custom-coordination', 'pkg-custom-zion', 'Event coordination', 'Planning and event coordination baseline.', true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('incl-custom-addons', 'pkg-custom-zion', 'Optional add-ons', 'Add-ons may be attached based on the final event scope.', false, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "package_versions" (
  "id",
  "package_id",
  "version_number",
  "snapshot_data",
  "change_summary",
  "created_by",
  "created_at"
)
SELECT
  CONCAT('version-', p."id"),
  p."id",
  p."current_version",
  jsonb_build_object(
    'eventCategory', jsonb_build_object(
      'id', category."id",
      'name', category."name",
      'slug', category."slug"
    ),
    'packageId', p."id",
    'packageVersion', p."current_version",
    'packageName', p."package_name",
    'slug', p."slug",
    'description', p."description",
    'price', p."price",
    'currency', p."currency",
    'paxIncluded', p."pax_included",
    'excessPaxFee', p."excess_pax_fee",
    'reservationFee', p."reservation_fee",
    'downPaymentAmount', p."down_payment_amount",
    'fullPaymentAmount', p."full_payment_amount",
    'checkInTime', p."check_in_time",
    'checkOutTime', p."check_out_time",
    'packageImageUrl', p."package_image_url",
    'contractItemDescription', p."contract_item_description",
    'contractInclusionDescription', p."contract_inclusion_description",
    'status', p."status",
    'clientVisible', p."client_visible",
    'inclusions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', inclusion."id",
        'name', inclusion."inclusion_name",
        'description', inclusion."description",
        'isFree', inclusion."is_free",
        'isOptional', inclusion."is_optional",
        'displayOrder', inclusion."display_order"
      ) ORDER BY inclusion."display_order", inclusion."created_at")
      FROM "package_inclusions" inclusion
      WHERE inclusion."package_id" = p."id"
    ), '[]'::jsonb)
  ),
  'Initial seeded package version.',
  'system',
  CURRENT_TIMESTAMP
FROM "packages" p
JOIN "event_categories" category ON category."id" = p."event_category_id"
ON CONFLICT ("package_id", "version_number") DO NOTHING;
