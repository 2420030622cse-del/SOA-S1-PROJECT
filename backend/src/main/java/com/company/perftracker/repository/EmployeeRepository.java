package com.company.perftracker.repository;

import com.company.perftracker.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeIdIgnoreCase(String employeeId);
    boolean existsByEmployeeIdIgnoreCase(String employeeId);
    void deleteByEmployeeIdIgnoreCase(String employeeId);
}
