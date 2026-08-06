package com.company.perftracker.dto;

import com.company.perftracker.entity.Employee;
import com.company.perftracker.entity.PerformanceEvent;
import com.company.perftracker.service.ScoringService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/** Full employee view returned to the frontend, including score, level and event history. */
public class EmployeeResponse {

    private String employeeId;
    private String name;
    private String department;
    private String designation;
    private Double experienceYears;
    private Double performanceScore;
    private String performanceLevel;
    private List<EventDto> history;

    public static EmployeeResponse from(Employee e) {
        EmployeeResponse dto = new EmployeeResponse();
        dto.employeeId = e.getEmployeeId();
        dto.name = e.getName();
        dto.department = e.getDepartment();
        dto.designation = e.getDesignation();
        dto.experienceYears = e.getExperienceYears();
        dto.performanceScore = e.getPerformanceScore();
        dto.performanceLevel = ScoringService.getPerformanceLevel(e.getPerformanceScore());
        dto.history = e.getHistory().stream().map(EventDto::from).collect(Collectors.toList());
        return dto;
    }

    public static class EventDto {
        public String eventType;
        public String eventName;
        public Double baseValue;
        public Double previousScore;
        public Double newScore;
        public Double delta;
        public LocalDateTime eventDate;

        public static EventDto from(PerformanceEvent ev) {
            EventDto dto = new EventDto();
            dto.eventType = ev.getEventType();
            dto.eventName = ev.getEventName();
            dto.baseValue = ev.getBaseValue();
            dto.previousScore = ev.getPreviousScore();
            dto.newScore = ev.getNewScore();
            dto.delta = ev.getDelta();
            dto.eventDate = ev.getEventDate();
            return dto;
        }
    }

    // getters (needed for Jackson serialization)
    public String getEmployeeId() { return employeeId; }
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public String getDesignation() { return designation; }
    public Double getExperienceYears() { return experienceYears; }
    public Double getPerformanceScore() { return performanceScore; }
    public String getPerformanceLevel() { return performanceLevel; }
    public List<EventDto> getHistory() { return history; }
}
