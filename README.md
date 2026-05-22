# HeadsUp Eye — Backend

Monolithic backend for the HeadsUp Eye workforce & attendance platform.
**Node.js + Express + MongoDB (Mongoose).** Folder layout and code style follow
`backend-elevate`'s services (config / controllers / models / routes / utils),
but everything lives in one service — no microservices, no Consul.

## Run

```bash
npm install
npm run dev      # nodemon, http://localhost:4000
# or: npm start
```

Needs MongoDB running locally (`mongodb://localhost:27017/headsupeye`).
On first start the database is **auto-seeded** with demo roles, units, users
and employees. Re-seed anytime with `npm run seed` (clears + reloads).

### Demo users

| Email | Password | Role |
| --- | --- | --- |
| `admin@headsupeye.com` | `admin123` | Super Admin |
| `manager@headsupeye.com` | `manager123` | Unit Manager |
| `hr@headsupeye.com` | `hr123` | HR Executive |

## API

Base URL `http://localhost:4000/api` — **every endpoint is `POST`**.
`POST /api/auth/login` is public; all others require an
`Authorization: Bearer <token>` header.

Success → `{ statusCode, data, message? }` · Error → `{ error }` (HTTP 4xx/5xx).

| Resource | Endpoints |
| --- | --- |
| Auth | `auth/login` |
| Units | `units/search` · `units/get` · `units/create` · `units/update` · `units/delete` |
| Employees | `employees/search` · `employees/get` · `employees/create` · `employees/update` · `employees/delete` |
| Users | `users/search` · `users/get` · `users/create` · `users/update` · `users/delete` |
| Roles | `roles/search` · `roles/get` · `roles/create` · `roles/update` · `roles/delete` |
| Dashboard | `dashboard/stats` |

`*/search` accepts `{ page, limit, search, ...filters }` and returns a
`mongoose-paginate-v2` result (`{ docs, totalDocs, totalPages, page, limit }`).

## Connect the panel

In the frontend's `.env` set `VITE_USE_MOCK=false` (the panel already points at
`http://localhost:4000/api/`). The frontend unwraps the `{ statusCode, data }`
envelope automatically.

## Structure

```
headsupeyebackend/
  server.js            app wiring + startup
  config/database.js   MongoDB connection
  middleware/auth.js   JWT verification
  models/              User · Role · Unit · Employee
  controllers/         one class per resource
  routes/              one router per resource (all POST)
  utils/               helpers + seed
```

## Notes

- `backend-elevate` is microservices with Consul service discovery. A monolith
  has nothing to discover, so Consul is intentionally omitted.
- Attendance (face punch logs, worked hours) will be added with the React
  Native app — the `Employee.faceId` / `faceEnrolled` fields are already in place.
# headsupeyebackend
