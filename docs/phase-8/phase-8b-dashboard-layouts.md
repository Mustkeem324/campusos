# Phase 8B — Custom Dashboard Widgets and Saved Layouts

Phase 8B provides the complete persistence, authorisation, validation, concurrency and frontend editing contract for personal dashboard layouts.

## Frontend dashboard designer

Authenticated users can open:

```text
/dashboard/customize
```

A **Customize dashboard** shortcut is also displayed across dashboard workspaces.

The designer includes:

- a role-authorised widget gallery
- search and category filters
- drag-and-drop reordering
- keyboard-friendly earlier/later movement controls
- bounded width and height controls
- add, remove and deterministic auto-arrange actions
- multiple named layouts
- create, copy, rename, activate and delete operations
- reset to the recommended role layout
- unsaved-change detection and browser-leave protection
- revision-conflict guidance when another session saved first
- a responsive 12-column desktop canvas and mobile stacked view

The canvas previews structure, order and size only. It deliberately does not fabricate academic, financial or operational values. Live widget data remains subject to existing server-side role, tenant and domain policies.

## Storage design

Dashboard layouts are stored under `User.preferences.phase8DashboardLayouts`.

This intentionally avoids a database migration for this release while preserving all unrelated user preferences. The stored envelope includes:

- schema version
- optimistic revision
- active layout ID per dashboard surface
- up to 10 named layouts
- layout version, timestamps and source
- widget placements and bounded settings

The server is the only trusted writer. Clients never send tenant IDs, user IDs, roles or catalogue definitions.

## API

### Read layouts and widget catalogue

```http
GET /api/dashboard-layouts?dashboardKey=main
```

Returns the authenticated user’s layouts, active layout, role-authorised widget catalogue, grid limits and current revision.

### Create a layout

```http
POST /api/dashboard-layouts
Content-Type: application/json

{
  "expectedRevision": 0,
  "name": "My academic view",
  "dashboardKey": "main",
  "activate": true
}
```

`copyFromLayoutId` may be supplied to clone another saved layout on the same dashboard surface.

### Update a layout

```http
PATCH /api/dashboard-layouts/{layoutId}
Content-Type: application/json

{
  "expectedRevision": 1,
  "name": "Focused academic view",
  "widgets": [
    {
      "instanceId": "attendance-primary",
      "widgetKey": "attendance-overview",
      "x": 0,
      "y": 0,
      "width": 4,
      "height": 3,
      "settings": {}
    }
  ],
  "activate": true
}
```

### Activate a layout

```http
POST /api/dashboard-layouts/{layoutId}/activate
Content-Type: application/json

{ "expectedRevision": 2 }
```

### Delete a layout

```http
DELETE /api/dashboard-layouts/{layoutId}
Content-Type: application/json

{ "expectedRevision": 3 }
```

Deleting the final layout for a dashboard surface automatically restores the role-recommended default.

### Reset a dashboard surface

```http
POST /api/dashboard-layouts/reset
Content-Type: application/json

{
  "expectedRevision": 4,
  "dashboardKey": "main"
}
```

## Security and correctness

- Identity, tenant and role come from `requireActiveUserContext()`.
- The catalogue is filtered by persisted active role.
- A user cannot save a widget unavailable to that role.
- Widget bounds, per-widget size rules, duplicate IDs and rectangle overlap are validated server-side.
- The frontend deterministically repacks cards after drag, movement and resize operations to avoid overlaps before save.
- Settings are limited to 8 KiB per widget.
- The complete preference document is limited to 96 KiB.
- A layout may contain at most 30 widgets.
- An account may save at most 10 layouts.
- All mutation endpoints require `expectedRevision`.
- An atomic `updatedAt` comparison prevents lost updates from concurrent sessions.
- Every successful mutation writes a user- and tenant-scoped audit record.
- Responses use private no-store caching.
- Password hashes, session tokens, MFA secrets and protected domain records are never included.

## Tests

Backend policy tests cover catalogue isolation, role defaults, placement validation, overlap rejection, storage limits, preference preservation and stale-role sanitisation.

Frontend helper tests cover deterministic packing, drag-target reordering, keyboard movement, bounded resizing, widget creation, removal and change comparison.
