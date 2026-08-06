package com.company.perftracker.exception;

public class EmployeeNotFoundException extends RuntimeException {
    public EmployeeNotFoundException(String employeeId) {
        super("Employee '" + employeeId + "' was not found");
    }
}
