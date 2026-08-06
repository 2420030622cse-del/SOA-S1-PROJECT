package com.company.perftracker.controller;

import com.company.perftracker.dto.*;
import com.company.perftracker.service.EmployeeService;
import com.company.perftracker.service.FileImportService;
import com.company.perftracker.service.ScoringService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final FileImportService fileImportService;
    private final ScoringService scoringService;

    public EmployeeController(EmployeeService employeeService, FileImportService fileImportService,
                               ScoringService scoringService) {
        this.employeeService = employeeService;
        this.fileImportService = fileImportService;
        this.scoringService = scoringService;
    }

    /** GET /api/employees?search=&department=&sortDir=desc */
    @GetMapping
    public List<EmployeeResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String sortDir) {
        return employeeService.getEmployees(search, department, sortDir);
    }

    @GetMapping("/{employeeId}")
    public EmployeeResponse get(@PathVariable String employeeId) {
        return employeeService.getEmployee(employeeId);
    }

    /** Feature 1: Add Employee Manually */
    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse created = employeeService.addEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> delete(@PathVariable String employeeId) {
        employeeService.deleteEmployee(employeeId);
        return ResponseEntity.noContent().build();
    }

    /** Update Score: manager picks a positive/negative event, score is recalculated automatically. */
    @PostMapping("/{employeeId}/events")
    public EmployeeResponse recordEvent(@PathVariable String employeeId, @Valid @RequestBody ScoreEventRequest request) {
        return employeeService.updateScore(employeeId, request);
    }

    /** Feature 2: Bulk Import Employees (.xlsx / .csv / .txt) */
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public ImportResult bulkImport(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        return fileImportService.importFile(file);
    }

    /** Lets the frontend render the Update-Score event list without hardcoding it. */
    @GetMapping("/meta/events")
    public Map<String, List<EventTypeDto>> events() {
        return Map.of(
                "positive", scoringService.getPositiveEvents(),
                "negative", scoringService.getNegativeEvents()
        );
    }
}
