# Reading the Connector Catalog

`well_list_connectors` returns the connectable catalog with a live overlay: every connection the workspace already holds is represented on its own catalog row, so one call answers both "what can I connect?" and "what is connected?". Each row carries:

- `service_id` — the connector's stable catalog id. `name`, `category_id`, `logo_url` — what it is.
- `status` — `available` is connectable now; anything else (`coming_soon`, `unavailable`, `maintenance`) is not.
- `direction` — `input` is a data source Well reads from; `output` is a push-back destination (an accounting tool can appear as both).
- `data_domains` — the kinds this connector feeds, a list such as `["bank"]` or `["accounting"]`. Sometimes delivered as a JSON string; parse it.
- `is_connected` and `connection_status` — the live connection's state, `connection_status` being one of `enabled`, `processing`, `error`, `need_reconnect`, `to_configure`, `suspended`, or `disabled`, or null when nothing is connected. A `degraded` connection never reaches you: the server resolves it against its own sync history into `enabled` or `error` before the row ships.
- `last_successful_sync_at` — when data last landed, or null if it never has. `sync_in_progress` — a sync is running right now.
- `workspace_connector_id` — the connected instance's id, or null. `is_preselected` — Well recommends connecting this one now, and the picker card pre-checks exactly these rows.
- `install_url` — a one-click link that starts the connection in Well from any state: it signs the user in, opens the bank login or the provider's OAuth, and covers a reconnect as well as a first install. Null when the row is not `available`, and null on an `available` row the catalog holds without a slug — a bank institution. A null here never means the connector cannot be installed. `install_all_url` (see the `install-links` reference) reaches such a row, but only on a call that carries a batch link — and the two calls a bank institution usually arrives on, the unscoped catalog and `kind: "bank"` with no `q`, carry none. On those two the row has no link at all: narrow the call with `q` to obtain one.

## A known server-side gap

`well_list_connectors` pages a candidate set ordered on how well a connector MATCHES this workspace, not on whether it is CONNECTED, so a live connection can sit outside the page and the catalog then shows nothing connected for a kind it is connected to. When a user contradicts a `none` you just reported ("Qonto is connected"), believe them, search the catalog by name (`q`) to get the connected row, and report from that. Do not reach for `workspace_connectors` — one card per turn means its records table would land beside the picker. Never call `well_invoke_connector_tool` or any provider-specific tool either: this skill reads connection state, never provider data.

## Degrading gracefully on an older server

If `data_domains` is absent, fall back to one `kind`-scoped call per requested kind — those calls then span turns, one card each — and treat each call's rows as that kind. If `kind` is rejected as an unknown input too, read the catalog unscoped and fall back to `q` on the providers the user named. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.
