# School Admin Smoke Test

**Role:** School Admin  
**Estimated time:** 20–30 minutes

---

## Setup

1. Log in with the school admin test account credentials.
2. You should land on `/school-admin` (your school's admin dashboard).

---

## 1. Dashboard Overview

- [ ] Page loads without errors.
- [ ] Your school name is visible in the header or dashboard.

---

## 2. Programs

**What to check:** School admins can see all programs at their school.

- [ ] Navigate to `/school-admin/programs`.
- [ ] All programs for your school are listed (pending, approved, and rejected).
- [ ] Click a program — its details load correctly.
- [ ] Verify that certification requirements on the program are visible.

---

## 3. Pending Approvals

**What to check:** School admins can approve or reject programs submitted by coaches at their school.

- [ ] Navigate to `/school-admin/pending-approvals`.
- [ ] Pending programs from coaches at your school are listed.
- [ ] Approve a program — status changes to Approved.
- [ ] Reject a program with a reason — the coach will see it in their dashboard.

---

## 4. Coaches / Users

- [ ] Navigate to `/school-admin/users`.
- [ ] Coaches and other staff at your school are listed.
- [ ] Click a coach — their profile and certifications are visible.
- [ ] Confirm you cannot see users from other schools.

---

## 5. Certification Types

**What to check:** School admins can manage cert types for their school.

- [ ] Navigate to `/school-admin/certification-types`.
- [ ] Global certification types (managed by the platform admin) are visible and labeled accordingly.
- [ ] School-specific cert types are editable.
- [ ] Add a new school-specific cert type (name, validity period).
- [ ] Save — it appears in the list.

---

## 6. Coach Certifications

**What to check:** School admins can review certifications uploaded by their coaches.

- [ ] Navigate to `/school-admin/coach-certifications`.
- [ ] Certifications from coaches at your school are listed.
- [ ] Filter or sort by status (e.g., Expiring Soon, Expired).
- [ ] Click a certification — you see the details and any uploaded document.
- [ ] Approve or flag the cert.
- [ ] Confirm you cannot see certifications from coaches at other schools.

---

## 7. Students / Athletes

- [ ] Navigate to `/school-admin/students` or `/school-admin/athletes`.
- [ ] Students enrolled at your school's programs are listed.
- [ ] Click a student — their profile and registration details load.

---

## 8. Communications

- [ ] Navigate to `/school-admin/communications`.
- [ ] Existing communications targeted at your school are listed.
- [ ] Create a new communication (subject, body, audience scoped to your school).
- [ ] Save — it appears in the list.

---

## 9. School Settings

- [ ] Navigate to `/school-admin/settings` or `/school-admin/school`.
- [ ] Your school's name, colors, and other settings are displayed.
- [ ] Edit a field (e.g., contact email) and save.
- [ ] Refresh — the change persists.
