package com.company.perftracker.dto;

import java.util.ArrayList;
import java.util.List;

/** Summary returned after a bulk import (.csv / .txt / .xlsx). */
public class ImportResult {

    private int importedCount;
    private List<RowResult> rows = new ArrayList<>();

    public static class RowResult {
        public String employeeId;
        public String name;
        public String status; // OK | DUPLICATE | INVALID
        public String reason;

        public RowResult(String employeeId, String name, String status, String reason) {
            this.employeeId = employeeId;
            this.name = name;
            this.status = status;
            this.reason = reason;
        }
    }

    public int getImportedCount() { return importedCount; }
    public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

    public List<RowResult> getRows() { return rows; }
    public void setRows(List<RowResult> rows) { this.rows = rows; }

    public void addRow(RowResult r) { this.rows.add(r); }
}
