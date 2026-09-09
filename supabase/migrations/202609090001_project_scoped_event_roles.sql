-- Project/event roles are scoped to a user's membership in that event.
-- Existing users keep their account-level role for platform compatibility,
-- while event authorization uses event_members.role.

DO $$
BEGIN
  CREATE TYPE "EventRole" AS ENUM ('LEAD', 'TEAM_MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.event_members
  ADD COLUMN IF NOT EXISTS "role" "EventRole" NOT NULL DEFAULT 'TEAM_MEMBER';

-- Existing event creators are the lead for their existing projects.
UPDATE public.event_members AS members
SET "role" = 'LEAD'
FROM public.events AS events
WHERE members."eventId" = events.id
  AND members."userId" = events."createdBy";

CREATE INDEX IF NOT EXISTS event_members_user_id_idx
  ON public.event_members ("userId");

CREATE INDEX IF NOT EXISTS event_members_event_id_role_idx
  ON public.event_members ("eventId", "role");
