package com.company.perftracker.service;

import com.company.perftracker.dto.EventTypeDto;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Core performance-scoring engine.
 *
 * Formulas (as specified by the project brief):
 *   Increase = BaseReward  x (100 - CurrentScore) / 100
 *   Decrease = BasePenalty x (0.5 + CurrentScore / 100)
 *
 * The base reward/penalty values below are not specified numerically in the
 * brief, so this project defines one reasonable, easily-tunable value per
 * event type. Adjust EVENT_BASE_VALUES to change scoring behaviour globally —
 * nothing else in the app needs to change.
 */
@Service
public class ScoringService {

    public static final double INITIAL_SCORE = 70.0;

    public static final String TYPE_POSITIVE = "POSITIVE";
    public static final String TYPE_NEGATIVE = "NEGATIVE";

    /** key -> [label, baseValue] */
    private static final Map<String, Object[]> POSITIVE_EVENTS = new LinkedHashMap<>();
    private static final Map<String, Object[]> NEGATIVE_EVENTS = new LinkedHashMap<>();

    static {
        POSITIVE_EVENTS.put("completed_task", new Object[]{"Completed Task", 5.0});
        POSITIVE_EVENTS.put("high_priority_task", new Object[]{"High Priority Task Completed", 8.0});
        POSITIVE_EVENTS.put("client_appreciation", new Object[]{"Client Appreciation", 10.0});
        POSITIVE_EVENTS.put("fixed_critical_bug", new Object[]{"Fixed Critical Bug", 10.0});
        POSITIVE_EVENTS.put("certification_completed", new Object[]{"Certification Completed", 8.0});
        POSITIVE_EVENTS.put("innovation", new Object[]{"Innovation", 12.0});

        NEGATIVE_EVENTS.put("missed_deadline", new Object[]{"Missed Deadline", 5.0});
        NEGATIVE_EVENTS.put("task_reopened", new Object[]{"Task Reopened", 4.0});
        NEGATIVE_EVENTS.put("client_complaint", new Object[]{"Client Complaint", 10.0});
        NEGATIVE_EVENTS.put("critical_bug_introduced", new Object[]{"Critical Bug Introduced", 12.0});
        NEGATIVE_EVENTS.put("security_violation", new Object[]{"Security Violation", 15.0});
    }

    public List<EventTypeDto> getPositiveEvents() {
        return toDtoList(POSITIVE_EVENTS);
    }

    public List<EventTypeDto> getNegativeEvents() {
        return toDtoList(NEGATIVE_EVENTS);
    }

    private List<EventTypeDto> toDtoList(Map<String, Object[]> map) {
        return map.entrySet().stream()
                .map(e -> new EventTypeDto(e.getKey(), (String) e.getValue()[0], (Double) e.getValue()[1]))
                .collect(Collectors.toList());
    }

    /** Looks up an event's display name and base value by type + key. Throws if unknown. */
    public Object[] resolveEvent(String type, String key) {
        Map<String, Object[]> map = TYPE_POSITIVE.equals(type) ? POSITIVE_EVENTS : NEGATIVE_EVENTS;
        Object[] found = map.get(key);
        if (found == null) {
            throw new IllegalArgumentException("Unknown event key '" + key + "' for type " + type);
        }
        return found; // [label, base]
    }

    public double calculateIncrease(double base, double currentScore) {
        return base * (100 - currentScore) / 100.0;
    }

    public double calculateDecrease(double base, double currentScore) {
        return base * (0.5 + currentScore / 100.0);
    }

    /** Applies an event to a score, clamping the result to [0, 100] and rounding to 2 decimals. */
    public double applyEvent(double currentScore, String type, double base) {
        double raw = TYPE_POSITIVE.equals(type)
                ? currentScore + calculateIncrease(base, currentScore)
                : currentScore - calculateDecrease(base, currentScore);
        double clamped = Math.max(0.0, Math.min(100.0, raw));
        return Math.round(clamped * 100.0) / 100.0;
    }

    public static String getPerformanceLevel(double score) {
        if (score >= 95) return "Outstanding";
        if (score >= 85) return "Excellent";
        if (score >= 75) return "Very Good";
        if (score >= 65) return "Good";
        if (score >= 50) return "Needs Improvement";
        return "Performance Review Required";
    }
}
