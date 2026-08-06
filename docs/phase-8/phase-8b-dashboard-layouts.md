# Phase 8B — Custom Dashboard Widgets and Saved Layouts

Phase 8B is backend-first. It establishes the persistence, authorisation, validation and concurrency contract required by a later drag-and-drop dashboard editor.

## Storage design

Dashboard layouts are stored under `User.preferences.phase8DashboardLayouts`.

This intentionally avoids a database migration for the first release while preserving all unrelated user preferences. The stored envelope includes:

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
- Settings are limited to 8 KiB per widget.
- The complete preference document is limited to 96 KiB.
- A layout may contain at most 30 widgets.
- An account may save at most 10 layouts.
- All mutation endpoints require `expectedRevision`.
- An atomic `updatedAt` comparison prevents lost updates from concurrent sessions.
- Every successful mutation writes a user- and tenant-scoped audit record.
- Responses use private no-store caching.
- Password hashes, session tokens, MFA secrets and protected domain records are never included.

## Frontend follow-up

The next frontend release can safely build on this contract to add:

- widget gallery
- drag-and-drop placement
- resize controls
- create, duplicate, rename, activate and delete layout actions
- reset to role recommendation
- revision-conflict reload UI
- mobile single-column rendering derived from the saved desktop grid
