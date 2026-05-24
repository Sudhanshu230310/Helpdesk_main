-- CreateEnum
CREATE TYPE "otp_purpose" AS ENUM ('registration', 'ticket_closure');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'with_user', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'technician', 'user', 'team_lead');

-- CreateTable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "performed_by" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" BIGSERIAL NOT NULL,
    "to_email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT,
    "status" VARCHAR(20) DEFAULT 'sent',
    "error_message" TEXT,
    "ticket_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" SERIAL NOT NULL,
    "subcategory_id" INTEGER NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "field_label" VARCHAR(200) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL DEFAULT 'text',
    "field_options" JSONB,
    "is_required" BOOLEAN DEFAULT false,
    "display_order" INTEGER DEFAULT 0,
    "parent_field_id" INTEGER,
    "parent_field_value" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "is_recurring" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "otp_code" VARCHAR(10) NOT NULL,
    "purpose" "otp_purpose" NOT NULL,
    "ticket_id" UUID,
    "is_used" BOOLEAN DEFAULT false,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "assigned_team_id" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_assigned_user_id" UUID,
    "escalation_hours" INTEGER DEFAULT 48,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("setting_key")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "team_lead_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_files" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "original_name" VARCHAR(500) NOT NULL,
    "stored_name" VARCHAR(500) NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_interactions" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_items" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "item_type" VARCHAR(100),
    "quantity" INTEGER DEFAULT 1,
    "serial_number" VARCHAR(100),
    "notes" TEXT,
    "provided_by" UUID,
    "provided_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_number" VARCHAR(20) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "priority" "ticket_priority" DEFAULT 'medium',
    "status" "ticket_status" DEFAULT 'open',
    "created_by" UUID NOT NULL,
    "assigned_to" UUID,
    "assigned_team_id" INTEGER,
    "form_data" JSONB,
    "created_on_behalf" BOOLEAN DEFAULT false,
    "behalf_user_id" UUID,
    "with_user_since" TIMESTAMP(6),
    "total_user_hold_time" interval DEFAULT '00:00:00'::interval,
    "resolved_at" TIMESTAMP(6),
    "closed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "phone" VARCHAR(20),
    "role" "user_role" NOT NULL DEFAULT 'user',
    "department" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT true,
    "is_verified" BOOLEAN DEFAULT false,
    "ldap_dn" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "session_token" VARCHAR(100),
    "email_notifications_enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_ticket_id_key" ON "feedback"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holiday_date_key" ON "holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "idx_otp_email" ON "otp_verifications"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_name_key" ON "subcategories"("category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE INDEX "idx_ticket_interactions_ticket" ON "ticket_interactions"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "idx_tickets_assigned_to" ON "tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_tickets_category" ON "tickets"("category_id");

-- CreateIndex
CREATE INDEX "idx_tickets_created_at" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "idx_tickets_created_by" ON "tickets"("created_by");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "idx_tickets_team" ON "tickets"("assigned_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_parent_field_id_fkey" FOREIGN KEY ("parent_field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_last_assigned_user_id_fkey" FOREIGN KEY ("last_assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_files" ADD CONSTRAINT "ticket_files_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_files" ADD CONSTRAINT "ticket_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_interactions" ADD CONSTRAINT "ticket_interactions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_interactions" ADD CONSTRAINT "ticket_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_provided_by_fkey" FOREIGN KEY ("provided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_behalf_user_id_fkey" FOREIGN KEY ("behalf_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
