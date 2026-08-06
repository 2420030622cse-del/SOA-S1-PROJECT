package com.company.perftracker.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_events")
public class PerformanceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /** POSITIVE or NEGATIVE */
    @Column(name = "event_type", nullable = false, length = 10)
    private String eventType;

    @Column(name = "event_name", nullable = false, length = 100)
    private String eventName;

    @Column(name = "base_value", nullable = false)
    private Double baseValue;

    @Column(name = "previous_score", nullable = false)
    private Double previousScore;

    @Column(name = "new_score", nullable = false)
    private Double newScore;

    @Column(name = "score_delta", nullable = false)
    private Double delta;

    @Column(name = "event_date", nullable = false)
    private LocalDateTime eventDate = LocalDateTime.now();

    public PerformanceEvent() {}

    public PerformanceEvent(String eventType, String eventName, Double baseValue,
                             Double previousScore, Double newScore) {
        this.eventType = eventType;
        this.eventName = eventName;
        this.baseValue = baseValue;
        this.previousScore = previousScore;
        this.newScore = newScore;
        this.delta = Math.round((newScore - previousScore) * 100.0) / 100.0;
        this.eventDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public Double getBaseValue() { return baseValue; }
    public void setBaseValue(Double baseValue) { this.baseValue = baseValue; }

    public Double getPreviousScore() { return previousScore; }
    public void setPreviousScore(Double previousScore) { this.previousScore = previousScore; }

    public Double getNewScore() { return newScore; }
    public void setNewScore(Double newScore) { this.newScore = newScore; }

    public Double getDelta() { return delta; }
    public void setDelta(Double delta) { this.delta = delta; }

    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }
}
