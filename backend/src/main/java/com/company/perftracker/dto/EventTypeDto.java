package com.company.perftracker.dto;

/** Describes one selectable event in the "Update Score" dropdown. */
public class EventTypeDto {
    private final String key;
    private final String label;
    private final Double base;

    public EventTypeDto(String key, String label, Double base) {
        this.key = key;
        this.label = label;
        this.base = base;
    }

    public String getKey() { return key; }
    public String getLabel() { return label; }
    public Double getBase() { return base; }
}
