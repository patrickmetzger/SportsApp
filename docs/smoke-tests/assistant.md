# Assistant Smoke Test

**Role:** Assistant  
**Estimated time:** 15–20 minutes

---

## Setup

1. Log in with the assistant test account credentials.
2. You should land on `/dashboard/assistant`.

---

## 1. Dashboard Overview

- [ ] Page loads without errors.
- [ ] Your assigned program(s) or a summary of your work is visible.

---

## 2. Certifications

**What to check:** Assistants can upload and manage their own certifications.

- [ ] Navigate to `/dashboard/assistant/certifications`.
- [ ] Your existing certifications are listed (or an empty state if none).
- [ ] Each cert shows its status: Valid, Expiring Soon, or Expired.

**Upload a new certification:**
- [ ] Click **Add Certification** (or equivalent).
- [ ] Select a certification type from the dropdown.
- [ ] Fill in: certificate number (optional), issuing organization, issue date, expiration date.
- [ ] Upload a PDF or image document.
- [ ] Save — the new cert appears in your list with a Valid or Expiring Soon status based on the expiration date you entered.

**Upload via scan/OCR (if available):**
- [ ] Navigate to `/dashboard/assistant/certifications/upload`.
- [ ] Upload a photo or scan of a physical certificate.
- [ ] Confirm that extracted data (name, expiration date, etc.) appears pre-filled.
- [ ] Correct any errors and save.

---

## 3. Attendance

**What to check:** Assistants can take attendance for programs they are assigned to.

- [ ] Navigate to `/dashboard/assistant/attendance`.
- [ ] A list of programs (or sessions) you can take attendance for is shown.
- [ ] Select a program and a date.
- [ ] The student roster for that program loads.
- [ ] Mark several students as present and several as absent.
- [ ] Save — a confirmation appears.
- [ ] Navigate back and reopen the same session — your saved attendance is shown correctly.

**Edge case:**
- [ ] Try selecting a program that has not started yet. The attendance input should be disabled or show an appropriate message.

---

## 4. Pending Review (if applicable)

- [ ] Navigate to `/dashboard/assistant/pending`.
- [ ] If there are items awaiting your action, they are listed.
- [ ] Complete one item and confirm it moves out of the pending queue.
