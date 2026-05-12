# Coach Smoke Test

**Role:** Coach  
**Estimated time:** 20–30 minutes

---

## Setup

1. Log in with the coach test account credentials.
2. If prompted with a role picker (you have multiple roles), select **Coach**.
3. You should land on `/dashboard/coach`.

---

## 1. Dashboard Layout

**What to check:** The dashboard shows meaningful sections, not just numbers.

- [ ] Page loads without errors.
- [ ] You see an **Action Required** section if any programs were rejected.
- [ ] You see a **Live Now** section (or an empty state if no programs are currently running).
- [ ] You see an **Upcoming** section with future programs, sorted by start date.
- [ ] If there are no live or upcoming programs, you see a friendly empty state message.

---

## 2. Required Tasks Banner

**What to check:** If you have outstanding issues, they follow you to other pages.

- [ ] Navigate to `/dashboard/coach/certifications`.
- [ ] If you have rejected programs: a red banner appears at the top listing each rejected program with an **Edit & Resubmit** button.
- [ ] If you have missing required certifications: an amber banner appears showing which programs need which certs.
- [ ] The amber banner does **not** show a "View Certs" button (since you're already on the certs page).
- [ ] Navigate to any other page (e.g., `/dashboard/coach/attendance`).
- [ ] The banner appears on that page too, and the **View Certs** button is now visible.
- [ ] Navigate back to `/dashboard/coach`. The banner is **not** shown here (tasks are shown inline instead).

---

## 3. Submit a New Program

**What to check:** Coaches can create programs for their school.

- [ ] From the dashboard, click the button to submit a new program.
- [ ] Fill in all required fields: name, description, start date, end date, registration deadline, cost.
- [ ] Optionally upload a header image.
- [ ] Click **Submit**.
- [ ] You are redirected back and see the new program with an **Awaiting Approval** badge.
- [ ] The program appears in the **Action Required** area of the dashboard (as pending) or in a pending state on your programs list.

---

## 4. Edit a Program

**What to check:** Coaches can edit programs they submitted or are assigned to.

- [ ] Find a program you submitted or are assigned to.
- [ ] Click **Edit** on that program card.
- [ ] Change the program name or description.
- [ ] Click **Save**.
- [ ] Confirm the updated details appear on the program.

**If the program was rejected:**
- [ ] Click **Edit & Resubmit** from the Action Required section.
- [ ] Make a change and save.
- [ ] The program status changes back to **Awaiting Approval**.

---

## 5. Certification Requirements on a Program

**What to check:** Coaches can view and manage cert requirements on programs they run.

- [ ] Open the edit page for a program you're assigned to.
- [ ] Scroll to the **Certification Requirements** section.
- [ ] Certs marked **Managed by admin** are visible but grayed out — you cannot toggle them.
- [ ] You can toggle the **Required / Recommended** pill on editable certs.
- [ ] Check a certification to add it to the program; uncheck to remove it.
- [ ] If a cert you need isn't listed, use the **Add new certification type** form to create one for your school.
- [ ] Save the program and reopen the edit page — your cert selections are preserved.

---

## 6. Certifications

**What to check:** Coaches can see and manage their own certifications.

- [ ] Navigate to `/dashboard/coach/certifications`.
- [ ] Your existing certifications are listed with their status (Valid, Expiring Soon, Expired).
- [ ] Click **Add Certification**.
- [ ] Select a certification type from the dropdown and fill in the details.
- [ ] Optionally upload a document.
- [ ] Save — the new cert appears in your list.

---

## 7. Attendance

**What to check:** Attendance is accessible directly from the dashboard for live programs.

- [ ] On the dashboard, find a program under **Live Now**.
- [ ] The **Take Attendance** button is enabled (teal/green).
- [ ] Click **Take Attendance** — you reach the attendance page for that program.
- [ ] Mark a few students present/absent and save.

**Edge case:**
- [ ] Find a program under **Upcoming** (not yet live).
- [ ] The **Take Attendance** button is grayed out and not clickable.

---

## 8. Multi-Role Switching (only if your account has multiple roles)

**What to check:** You can switch between roles without logging out.

- [ ] Look for your name/role label in the top-right corner of the header.
- [ ] Click it — a dropdown appears showing your other available roles.
- [ ] Click a different role.
- [ ] You are redirected to that role's dashboard.
- [ ] Switch back to Coach and confirm you return to `/dashboard/coach`.
