# Employee Performance Tracking System — Backend

Spring Boot + MySQL backend for the college mini project. Implements employee
CRUD, bulk import (.xlsx / .csv / .txt via Apache POI), and the automated
performance-scoring engine described in the project brief.

## 1. Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.x running locally

## 2. Setup

1. Create the database (or let Hibernate do it — see step 3):
   ```sql
   CREATE DATABASE perftracker_db;
   ```
2. Edit `src/main/resources/application.properties` and set your MySQL
   username/password:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```
3. Run the app:
   ```bash
   mvn spring-boot:run
   ```
   Tables are created automatically on first run (`spring.jpa.hibernate.ddl-auto=update`).
   `schema.sql` in `src/main/resources` is provided as a reference if you'd
   rather create tables manually.

The API is served at `http://localhost:8080/api/employees`.

## 3. API Reference

| Method | Endpoint                              | Purpose                                   |
|--------|----------------------------------------|--------------------------------------------|
| GET    | `/api/employees?search=&department=&sortDir=` | List/search/filter/sort employees   |
| GET    | `/api/employees/{employeeId}`          | Get one employee + full event history     |
| POST   | `/api/employees`                       | Add employee manually (Feature 1)          |
| DELETE | `/api/employees/{employeeId}`          | Delete an employee                         |
| POST   | `/api/employees/{employeeId}/events`   | Record a positive/negative event → auto-recalculates score |
| POST   | `/api/employees/import` (multipart)    | Bulk import from .xlsx / .csv / .txt (Feature 2) |
| GET    | `/api/employees/meta/events`           | Returns the positive/negative event catalog (for building the Update Score dropdown) |

**Add employee — POST `/api/employees`**
```json
{
  "employeeId": "EMP001",
  "name": "Rahul Sharma",
  "department": "Software Development",
  "designation": "Software Engineer",
  "experienceYears": 2
}
```

**Record an event — POST `/api/employees/EMP001/events`**
```json
{ "eventType": "POSITIVE", "eventKey": "client_appreciation" }
```
The server looks up the base value for `client_appreciation` itself — the
client never sends a score delta directly, which keeps the scoring logic
tamper-proof.

**Bulk import — POST `/api/employees/import`**
Send as `multipart/form-data` with a `file` field. Accepts a header row or
not; if present, columns are matched by name (EmployeeID, Name, Department,
Designation, Experience — case/spacing insensitive). Returns a per-row report
(`OK` / `DUPLICATE` / `INVALID`) plus the count actually imported.

## 4. Scoring engine

```
Increase = BaseReward  x (100 - CurrentScore) / 100
Decrease = BasePenalty x (0.5 + CurrentScore / 100)
```
Both are implemented in `ScoringService`, clamped to the 0–100 range.

**Note on base values:** the project brief names each event type but does not
assign numeric BaseReward/BasePenalty values. This implementation defines one
reasonable value per event (see `ScoringService.POSITIVE_EVENTS` /
`NEGATIVE_EVENTS`) so the app is fully runnable out of the box. They're
plain constants — change them in one place to tune scoring behaviour:

| Positive Event | Base | | Negative Event | Base |
|---|---|---|---|---|
| Completed Task | 5 | | Missed Deadline | 5 |
| High Priority Task Completed | 8 | | Task Reopened | 4 |
| Client Appreciation | 10 | | Client Complaint | 10 |
| Fixed Critical Bug | 10 | | Critical Bug Introduced | 12 |
| Certification Completed | 8 | | Security Violation | 15 |
| Innovation | 12 | | | |

Performance levels (`ScoringService.getPerformanceLevel`) follow the brief
exactly: 95–100 Outstanding, 85–94 Excellent, 75–84 Very Good, 65–74 Good,
50–64 Needs Improvement, below 50 Performance Review Required.

## 5. Project structure

```
src/main/java/com/company/perftracker/
  entity/         Employee, PerformanceEvent (JPA entities)
  dto/            Request/response payloads
  repository/     Spring Data JPA repository
  service/        ScoringService, EmployeeService, FileImportService
  controller/      EmployeeController (REST API)
  config/         CORS configuration
  exception/      Custom exceptions + global JSON error handler
```

## 6. Connecting the React frontend

The included `EmployeePerformanceTracker.jsx` (see the separate frontend
deliverable) runs as a self-contained interactive demo with its own local
persistence, so it works without this backend. To wire it to this API
instead, replace its storage calls with `fetch` calls to the endpoints above,
e.g.:

```js
const res = await fetch('http://localhost:8080/api/employees');
const employees = await res.json();
```

Update `CorsConfig.allowedOrigins` if your frontend runs on a different port.
