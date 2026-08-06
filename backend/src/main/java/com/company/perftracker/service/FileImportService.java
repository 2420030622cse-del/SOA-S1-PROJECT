package com.company.perftracker.service;

import com.company.perftracker.dto.ImportResult;
import com.company.perftracker.entity.Employee;
import com.company.perftracker.repository.EmployeeRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Parses bulk-import files (Feature 2). Supports .csv, .txt (comma separated)
 * and .xlsx / .xls (via Apache POI). Expected columns, in order, unless a
 * header row is present:
 *   EmployeeID, Name, Department, Designation, Experience
 */
@Service
public class FileImportService {

    private static final List<String> COLUMN_ORDER =
            List.of("employeeId", "name", "department", "designation", "experience");

    private final EmployeeRepository employeeRepository;

    public FileImportService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public ImportResult importFile(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        List<Map<String, String>> rawRows;

        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            rawRows = parseExcel(file);
        } else if (filename.endsWith(".csv") || filename.endsWith(".txt")) {
            rawRows = parseDelimited(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Use .csv, .txt, or .xlsx");
        }

        return validateAndImport(rawRows);
    }

    /* ---------------- CSV / TXT ---------------- */

    private List<Map<String, String>> parseDelimited(MultipartFile file) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",", -1);
                List<String> row = new ArrayList<>();
                for (String p : parts) row.add(p.trim().replaceAll("^\"|\"$", ""));
                rows.add(row);
            }
        }
        return rowsToMaps(rows);
    }

    /* ---------------- Excel (.xlsx / .xls) ---------------- */

    private List<Map<String, String>> parseExcel(MultipartFile file) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            for (Row row : sheet) {
                List<String> cells = new ArrayList<>();
                boolean anyContent = false;
                for (Cell cell : row) {
                    String value = formatter.formatCellValue(cell).trim();
                    if (!value.isEmpty()) anyContent = true;
                    cells.add(value);
                }
                if (anyContent) rows.add(cells);
            }
        }
        return rowsToMaps(rows);
    }

    /* ---------------- shared row -> map mapping ---------------- */

    private List<Map<String, String>> rowsToMaps(List<List<String>> rows) {
        if (rows.isEmpty()) return List.of();

        List<String> header = rows.get(0);
        boolean hasHeader = header.stream().anyMatch(h -> normalizeHeader(h) != null);

        List<String> columns;
        List<List<String>> dataRows;
        if (hasHeader) {
            columns = header.stream().map(this::normalizeHeader).toList();
            dataRows = rows.subList(1, rows.size());
        } else {
            columns = COLUMN_ORDER;
            dataRows = rows;
        }

        List<Map<String, String>> result = new ArrayList<>();
        for (List<String> row : dataRows) {
            Map<String, String> map = new LinkedHashMap<>();
            for (int i = 0; i < columns.size() && i < row.size(); i++) {
                String key = columns.get(i);
                if (key != null) map.put(key, row.get(i));
            }
            result.add(map);
        }
        return result;
    }

    private String normalizeHeader(String h) {
        if (h == null) return null;
        String n = h.toLowerCase().replaceAll("[^a-z]", "");
        return switch (n) {
            case "employeeid", "id" -> "employeeId";
            case "name", "employeename" -> "name";
            case "department", "dept" -> "department";
            case "designation", "role" -> "designation";
            case "experience", "experienceyears", "exp" -> "experience";
            default -> null;
        };
    }

    /* ---------------- validation + persistence ---------------- */

    private ImportResult validateAndImport(List<Map<String, String>> rawRows) {
        ImportResult result = new ImportResult();
        Set<String> seenInBatch = new HashSet<>();
        List<Employee> toSave = new ArrayList<>();

        for (Map<String, String> r : rawRows) {
            String employeeId = r.getOrDefault("employeeId", "").trim();
            String name = r.getOrDefault("name", "").trim();
            String department = r.getOrDefault("department", "").trim();
            String designation = r.getOrDefault("designation", "").trim();
            String experienceStr = r.getOrDefault("experience", "").trim();

            if (employeeId.isEmpty() || name.isEmpty() || department.isEmpty()
                    || designation.isEmpty() || experienceStr.isEmpty()) {
                result.addRow(new ImportResult.RowResult(employeeId, name, "INVALID", "Missing required field"));
                continue;
            }

            double experience;
            try {
                experience = Double.parseDouble(experienceStr);
                if (experience < 0) throw new NumberFormatException();
            } catch (NumberFormatException ex) {
                result.addRow(new ImportResult.RowResult(employeeId, name, "INVALID", "Invalid experience value"));
                continue;
            }

            String key = employeeId.toLowerCase();
            if (seenInBatch.contains(key) || employeeRepository.existsByEmployeeIdIgnoreCase(employeeId)) {
                result.addRow(new ImportResult.RowResult(employeeId, name, "DUPLICATE", "Employee ID already exists"));
                continue;
            }

            seenInBatch.add(key);
            toSave.add(new Employee(employeeId, name, department, designation, experience));
            result.addRow(new ImportResult.RowResult(employeeId, name, "OK", null));
        }

        employeeRepository.saveAll(toSave);
        result.setImportedCount(toSave.size());
        return result;
    }
}
