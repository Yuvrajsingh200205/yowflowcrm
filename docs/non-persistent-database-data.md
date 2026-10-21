# Data Not Currently Stored In The Database

Read-only audit created on 2026-09-25. No database delete/reset/drop/truncate operation was run.

## Confirmed Not Database-Backed

| Area | What is not stored in DB | Current storage/behavior | Evidence |
| --- | --- | --- | --- |
| Equipment inventory | Studio equipment, gear status, assigned shoot/member, serial numbers, condition notes | Browser `localStorage` under `wpp_owner_equipment_inventory`; seeded from `INITIAL_EQUIPMENT` | `src/features/equipment/EquipmentInventory.tsx`, `src/features/equipment/equipmentData.ts` |
| Public freelancer applications legacy path | Public freelancer registration drafts/applications created through `storePublicFreelancerApplication` | Browser `localStorage` under `wpp_freelancer_public_applications` | `src/features/freelancers/freelancerPortal.ts` |
| Freelancer categories | Freelancer category configuration | React state initialized from `INITIAL_FREELANCER_CATEGORIES`; no API persistence found | `src/components/app/CrmApplication.tsx` |
| Freelancer assignments admin state | Assignment rows handled by `handleSaveFreelancerAssignments`, assignment status changes, assignment deletion from that local collection | React state only in `CrmApplication`; not saved through backend assignment APIs in those handlers | `src/components/app/CrmApplication.tsx` |
| Freelancer payments admin state | Payments added through `handleSaveFreelancerPayment` | React state only; updates local assignment payment totals | `src/components/app/CrmApplication.tsx` |
| Freelancer attendance admin state | Freelancer attendance added through `handleSaveFreelancerAttendance` | React state only | `src/components/app/CrmApplication.tsx` |
| Freelancer data received | Received-data records and status updates | React state only | `src/components/app/CrmApplication.tsx` |
| Freelancer activity logs | Activity log collection | React state only; no persistence path found | `src/components/app/CrmApplication.tsx` |
| Freelancer documents | Uploaded/edited freelancer document metadata | Explicitly blocked with alert: backend does not expose a freelancer document API yet | `src/components/app/CrmApplication.tsx` |
| Lead targets/goals | Lead target numbers and goal settings | Browser `localStorage` under `wpp_owner_lead_targets` | `src/features/leads/components/LeadsManagement.tsx` |
| Recurring expense templates | Recurring expense list | Browser `localStorage` under `wpp_crm_recurring_expenses_v1` | `src/features/expenses/services/expenseService.ts` |
| Expense budgets | Budget settings | Browser `localStorage` under `wpp_crm_expense_budgets_v1` | `src/features/expenses/services/expenseService.ts` |
| Social media accounts/calendar | Social accounts and social content posts | Browser `localStorage` under `wpp_social_accounts_v2` and `wpp_social_calendar_posts_v2` | `src/features/workspaces/components/SocialMediaCalendarWidget.tsx` |
| Website/content calendar | Website domains, website posts, domain notes, domain tasks, keywords, attachments | Browser `localStorage` under `wpp_web_domains_v2` and `wpp_web_calendar_posts_v2` | `src/features/workspaces/components/SocialMediaCalendarWidget.tsx` |
| Owner notepad hidden preference | Whether private notepad is hidden/shown | Browser `localStorage` under `wpp_owner_notepad_hidden`; notes themselves are DB-backed | `src/features/owner/components/OwnerNotepad.tsx` |

## Mostly Database-Backed, But With Local UI Preferences

| Area | Database-backed data | Local-only data |
| --- | --- | --- |
| Owner private notes | Note title/content/order are persisted through personal notes API | Hidden/show preference only |
| Leads | Lead records appear API-backed; old demo lead cache is removed | Targets/goals only |
| Expenses | Expense records, categories, payments, summaries use backend API | Recurring templates and budgets |
| Projects, tasks, shoots, attendance, leaves, team, clients, settings | Found API-backed hooks/services and Prisma-backed backend services | Some modal/filter/UI state is local by design |

## Backend Tables/Models Already Present

The Prisma/backend layer already has persistent services for these areas, so they are not on the missing-storage list:

- Auth/session, users/team, roles/permissions
- Projects, clients, project tasks, shoots, shoot assignments
- Attendance and leave requests
- Leads, quotations, invoices, payments
- Expenses, income, freelancer payouts
- Freelancers, freelancer plans/subscriptions, availability, portfolio, applications, marketplace connections
- Personal notes, personal todos, personal sheets
- Settings/module requests, audit logs, notifications, files/client assets

## Suggested Priority

1. Equipment inventory: visible business data, currently entirely browser-only.
2. Freelancer admin operations: assignments, payments, attendance, data received, documents.
3. Social/website content calendar: substantial operational data stored only in browser.
4. Expense budgets and recurring templates: finance planning data is local-only.
5. Lead targets/goals: small but business-relevant settings.
