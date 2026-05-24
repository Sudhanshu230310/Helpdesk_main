# Requirements Document

## 1. Overview
This document outlines the functional requirements for the system.

---

## 2. Assignment Handling
- One technician can handle multiple categories.
- Priority of assignments is decided by the Team Lead.

---

## 3. User Roles

### 3.1 Team Lead
- Under Admin and above teachnician in heirarchy
- Responsible for assigning priorities.
- Handles escalations after defined time.
- Can review and reopen tickets based on feedback.

### 3.2 Admin
- Has control over enabling/disabling OTP authentication.
- Can access full system controls.
- Can reopen tickets if required.
- OTP authentication for ticket closure should be configurable (enabled/disabled by Admin).

---

## 4. Authentication
- System should include:
  - Signup page
  - Login page
- Users should be redirected to a direct landing page after login.


---

## 5. Feedback Handling
- If negative feedback is received:
  - Ticket can be reopened by Team Lead or Admin.

---

## 6. Escalation Policy
- Tickets should be escalated after **48 business hours**.
- Escalation is directed to the Team Lead.
- Escalation timing may vary based on subcategory.

---

## 7. Business Rules
- Only **business days** should be considered for time calculations.

---

## 8. Reporting
- System should support exporting reports in **PDF format**.
- Report should include:
  - Generated timestamp
  - Footer containing:
    - Time generated
    - Page number

---