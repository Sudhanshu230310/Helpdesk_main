# Helpdesk Project Workflow Explanation

This document explains the core workflows and business logic of the Helpdesk/Ticketing System, based on the `README.md`, database schema, stored procedures, and backend controllers.

## 1. User & Authentication Workflow

The system supports three user roles: **Admin**, **Technician**, and **User**.

-   **User Registration**: New users can register via the `/api/auth/register` endpoint. A user record is created with the `user` role and `is_verified` set to `false`.
-   **Email Verification**: After registration (or for ticket closure), the system generates an OTP. The OTP is sent to the user's email via the `emailService`. The user verifies their email by submitting the OTP to `/api/auth/verify-otp`.
-   **Login Options**:
    -   *Standard Login*: Users log in using their email and password (`/api/auth/login`).
    -   *LDAP Login*: Technicians/Admins can log in via Active Directory/LDAP (`/api/auth/ldap-login`). If successful, their details are upserted into the local database.

## 2. Ticket Creation & Auto-Assignment Workflow

When a user faces an issue, they create a ticket. This process handles categorization and intelligent routing.

1.  **Form Loading**: The user selects a **Category** and a **Subcategory**. The frontend fetches dynamic form fields associated with the subcategory (`form_fields` table) to gather specific information.
2.  **Submission**: The user submits the form. Technicians can also raise tickets *on behalf* of users.
3.  **Auto-Assignment**:
    -   When the ticket is inserted, the database checks the chosen `subcategory_id`.
    -   If the subcategory has an `assigned_team_id`, the ticket is automatically assigned to that team.
    -   Furthermore, the system finds the `team_lead_id` for that team and automatically sets the ticket's `assigned_to` field to the team lead.
4.  **Notification**: An email is sent to the ticket creator (and the *behalf* user, if applicable) notifying them that the ticket has been created, capturing the generated `ticket_number` (e.g., `HD-20260001`).

## 3. Ticket Interaction & Management Workflow

Once a ticket is open and assigned, the resolution process involves communication and updates.

-   **Status Updates**: Technicians can change the ticket status (`open` -> `in_progress` -> `with_user` -> `resolved`). Status changes trigger audit logs.
-   **Conversation Thread**: Users and Technicians can interact by adding messages (`ticket_interactions` table). 
    -   *Internal Notes*: Technicians can add internal notes that are only visible to other Technicians/Admins, not the end-user.
    -   *Notifications*: Adding a message sends an email alert to the other parties involved (Creator/Assignee).
-   **File Uploads**: Users or technicians can attach files to the ticket.
-   **Item Tracking**: Technicians can record hardware/software items provided or replaced during the ticket resolution (`ticket_items` table).
-   **SLA / Turnaround Time Tracking**:
    -   If the technician needs info from the user, they set the status to `with_user`. The system tracks `total_user_hold_time`.
    -   Turnaround time is calculated accurately as the difference between ticket creation and closure, *minus* the time it spent in the `with_user` state, and *excluding* weekends and defined holidays.

## 4. Ticket Resolution & OTP Closure Workflow

To prevent technicians from prematurely closing tickets without user consent, a strict OTP-based closure process is enforced.

1.  **Resolution**: The technician resolves the issue and changes the ticket status to `resolved`.
2.  **Request Closure**: The technician requests ticket closure. The backend generates a secure OTP (`ticket_closure` purpose) and emails it exclusively to the user.
3.  **OTP Verification**: The user receives the OTP and submits it through the portal.
4.  **Closure & Feedback**: 
    -   The system verifies the OTP. If valid, the ticket status changes to `closed`.
    -   A final closure email alert is sent to all stakeholders (including Admins).
    -   Upon closure, the user is prompted to provide a star rating (1-5) and a comment, stored in the `feedback` table.

## 5. Admin & Reporting Workflow

Admins have holistic oversight over the system.

-   **System Configuration**: Admins can manage Teams, Categories, Subcategories, and Dynamic Form Fields to adapt the helpdesk to changing IT/business needs.
-   **Dashboards & Reports**: Admins can view aggregate metrics:
    -   Reports by Category, Team, and Technician.
    -   These reports rely heavily on the SLA/Turnaround Time calculations stored in the database.
-   **Audit Trail**: Every significant action (creation, status change, assignment) is logged in the `audit_logs` table with `old_values`, `new_values`, and the user who performed the action, ensuring complete compliance and transparency.
