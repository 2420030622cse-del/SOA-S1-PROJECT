package com.company.perftracker.exception;

public class DuplicateEmployeeException extends RuntimeException {
    public DuplicateEmployeeException(String employeeId) {
        super("Employee ID '" + employeeId + "' already exists");
    }
}
