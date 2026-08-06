-- Manual schema reference for Employee Performance Tracking System.
-- Not executed automatically (spring.jpa.hibernate.ddl-auto=update handles table
-- creation for you). Use this only if you prefer to create tables by hand or
-- your instructor requires an explicit SQL script in the submission.

CREATE DATABASE IF NOT EXISTS perftracker_db;
USE perftracker_db;

CREATE TABLE IF NOT EXISTS employees (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id       VARCHAR(30)  NOT NULL UNIQUE,
    name              VARCHAR(100) NOT NULL,
    department        VARCHAR(100) NOT NULL,
    designation       VARCHAR(100) NOT NULL,
    experience_years  DOUBLE       NOT NULL,
    performance_score DOUBLE       NOT NULL DEFAULT 70.0,
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_events (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id     BIGINT NOT NULL,
    event_type      VARCHAR(10)  NOT NULL,   -- POSITIVE | NEGATIVE
    event_name      VARCHAR(100) NOT NULL,
    base_value      DOUBLE       NOT NULL,
    previous_score  DOUBLE       NOT NULL,
    new_score       DOUBLE       NOT NULL,
    score_delta     DOUBLE       NOT NULL,
    event_date      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_perf_event_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_score ON employees(performance_score);
