package com.company.perftracker.service;

import com.company.perftracker.dto.EmployeeRequest;
import com.company.perftracker.dto.EmployeeResponse;
import com.company.perftracker.dto.ScoreEventRequest;
import com.company.perftracker.entity.Employee;
import com.company.perftracker.entity.PerformanceEvent;
import com.company.perftracker.exception.DuplicateEmployeeException;
import com.company.perftracker.exception.EmployeeNotFoundException;
import com.company.perftracker.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ScoringService scoringService;

    public EmployeeService(EmployeeRepository employeeRepository, ScoringService scoringService) {
        this.employeeRepository = employeeRepository;
        this.scoringService = scoringService;
    }

    @Transactional
    public EmployeeResponse addEmployee(EmployeeRequest req) {
        if (employeeRepository.existsByEmployeeIdIgnoreCase(req.getEmployeeId())) {
            throw new DuplicateEmployeeException(req.getEmployeeId());
        }
        Employee emp = new Employee(
                req.getEmployeeId().trim(), req.getName().trim(),
                req.getDepartment().trim(), req.getDesignation().trim(), req.getExperienceYears());
        return EmployeeResponse.from(employeeRepository.save(emp));
    }

    /**
     * Returns employees matching an optional search term (ID or name, case-insensitive),
     * an optional department filter, sorted by performance score if requested.
     * sortDir: "asc", "desc", or null/other for insertion order.
     */
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployees(String search, String department, String sortDir) {
        List<Employee> all = employeeRepository.findAll();

        List<Employee> filtered = all.stream()
                .filter(e -> search == null || search.isBlank()
                        || e.getEmployeeId().toLowerCase().contains(search.toLowerCase())
                        || e.getName().toLowerCase().contains(search.toLowerCase()))
                .filter(e -> department == null || department.isBlank() || "All".equalsIgnoreCase(department)
                        || e.getDepartment().equalsIgnoreCase(department))
                .collect(Collectors.toList());

        if ("asc".equalsIgnoreCase(sortDir)) {
            filtered.sort(Comparator.comparing(Employee::getPerformanceScore));
        } else if ("desc".equalsIgnoreCase(sortDir)) {
            filtered.sort(Comparator.comparing(Employee::getPerformanceScore).reversed());
        }

        return filtered.stream().map(EmployeeResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(String employeeId) {
        return EmployeeResponse.from(findOrThrow(employeeId));
    }

    @Transactional
    public void deleteEmployee(String employeeId) {
        if (!employeeRepository.existsByEmployeeIdIgnoreCase(employeeId)) {
            throw new EmployeeNotFoundException(employeeId);
        }
        employeeRepository.deleteByEmployeeIdIgnoreCase(employeeId);
    }

    @Transactional
    public EmployeeResponse updateScore(String employeeId, ScoreEventRequest req) {
        Employee emp = findOrThrow(employeeId);

        Object[] eventInfo = scoringService.resolveEvent(req.getEventType(), req.getEventKey());
        String label = (String) eventInfo[0];
        double base = (Double) eventInfo[1];

        double previousScore = emp.getPerformanceScore();
        double newScore = scoringService.applyEvent(previousScore, req.getEventType(), base);

        PerformanceEvent event = new PerformanceEvent(req.getEventType(), label, base, previousScore, newScore);
        emp.addHistoryEntry(event);
        emp.setPerformanceScore(newScore);

        return EmployeeResponse.from(employeeRepository.save(emp));
    }

    private Employee findOrThrow(String employeeId) {
        return employeeRepository.findByEmployeeIdIgnoreCase(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeId));
    }
}
