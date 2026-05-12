# Admin Smoke Test

**Role:** Admin  
**Estimated time:** 25–35 minutes

---

## Setup

1. Log in with the admin test account credentials.
2. You should land on `/admin` (the platform-wide admin dashboard).

---

## 1. Dashboard Overview

- [ ] Page loads without errors.
- [ ] Summary stats or recent activity are visible.

---

## 2. Schools

- [ ] Navigate to `/admin/schools`.
- [ ] The list of schools loads.
- [ ] Click into a school — you can see its details (name, colors, etc.).
- [ ] Edit the school's primary color and save. Confirm the change persists on refresh.

---

## 3. Users

- [ ] Navigate to `/admin/users`.
- [ ] The user list loads with names, emails, and roles.
- [ ] Use the search or filter to find a specific user.
- [ ] Click a user — their profile loads.

---

## 4. Pending Program Approvals

**What to check:** Admins can review and approve/reject programs submitted by coaches.

- [ ] Navigate to `/admin/pending-approvals`.
- [ ] At least one pending program is listed (use the coach test account to submit one first if needed).
- [ ] Click a pending program to view its details.
- [ ] Click **Approve** — the program status changes to Approved.
- [ ] Return to the list — the approved program is no longer in the pending queue.
- [ ] Submit another program as a coach, then come back and click **Reject**, providing a rejection reason.
- [ ] Confirm the rejection reason is saved.

---

## 5. Certification Types

**What to check:** Admins can manage the global list of certification types.

- [ ] Navigate to `/admin/certification-types`.
- [ ] The list of certification types loads.
- [ ] Click **Add** (or equivalent) to create a new global certification type.
- [ ] Fill in name, description, and validity period (months).
- [ ] Toggle **Universal** on — this cert will be required for all programs automatically.
- [ ] Save. The new cert type appears in the list.
- [ ] Edit it and change the validity period. Save. Confirm the change persists.

---

## 6. Coach Certifications Review

**What to check:** Admins can see and review certifications coaches have uploaded.

- [ ] Navigate to `/admin/coach-certifications`.
- [ ] A list of certifications across all coaches loads.
- [ ] Click into a certification — you can see the uploaded document (if any) and details.
- [ ] Approve or flag the certification and save.

---

## 7. Programs

- [ ] Navigate to `/admin/programs`.
- [ ] All programs across all schools are listed.
- [ ] Click a program — its details and certification requirements are visible.

---

## 8. Communications

- [ ] Navigate to `/admin/communications`.
- [ ] Existing communications are listed.
- [ ] Create a new communication (subject, body, audience).
- [ ] Save as draft — it appears in the list with a Draft status.

---

## 9. Impersonation (if available)

**What to check:** Admins can impersonate other users to debug issues.

- [ ] Navigate to `/admin/users` and open a coach's profile.
- [ ] Click **Impersonate** (or equivalent).
- [ ] You are taken to the coach dashboard with a banner indicating you are impersonating.
- [ ] Navigate around as the coach — data looks correct.
- [ ] Click **Stop Impersonating** — you return to the admin session.
