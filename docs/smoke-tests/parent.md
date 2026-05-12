# Parent Smoke Test

**Role:** Parent  
**Estimated time:** 15–20 minutes

---

## Setup

1. Log in with the parent test account credentials.
2. You should land on `/dashboard/parent`.

---

## 1. Dashboard Overview

- [ ] Page loads without errors.
- [ ] Your children's names or a summary of their registrations is visible.

---

## 2. Browse Programs

**What to check:** Parents can discover and view available programs.

- [ ] Navigate to `/programs` (the public program listing).
- [ ] Programs are listed with name, dates, cost, and a description.
- [ ] Click a program — its detail page loads with full information.
- [ ] The registration deadline and cost are clearly shown.

---

## 3. Register a Child

**What to check:** Parents can register their children for programs.

- [ ] From a program detail page, click **Register** (or equivalent).
- [ ] Select which child to register (your children should be pre-populated from your account).
- [ ] Fill in any required registration fields.
- [ ] Submit the registration.
- [ ] You see a confirmation message or are redirected to a confirmation page.
- [ ] Navigate to your parent dashboard — the registration appears under your child's name.

**Edge case:**
- [ ] Try registering for a program whose registration deadline has passed. You should see an error or the Register button should be disabled.

---

## 4. View Registrations

- [ ] Navigate to `/dashboard/parent` or a registrations sub-page.
- [ ] Each of your children's registrations is listed with the program name, dates, and status.
- [ ] Click a registration — the full details are shown.

---

## 5. Communications

**What to check:** Parents receive and can read communications from the school.

- [ ] Navigate to `/dashboard/parent/communications`.
- [ ] Any messages sent to parents (or your specific school) are listed.
- [ ] Click a message — the full content displays.
- [ ] Unread messages are marked visually differently from read ones.

---

## 6. Multi-Role Switching (only if your account has multiple roles)

**What to check:** If your account also has a coach or assistant role, you can switch.

- [ ] Look for your name/role label in the top-right corner of the header.
- [ ] Click it — a dropdown shows your other available roles.
- [ ] Switch to another role. You are taken to that role's dashboard.
- [ ] Switch back to Parent — you return to `/dashboard/parent`.
