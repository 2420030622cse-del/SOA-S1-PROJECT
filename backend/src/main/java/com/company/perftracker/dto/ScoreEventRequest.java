package com.company.perftracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Payload for the "Update Score" action.
 * eventType must be POSITIVE or NEGATIVE; eventKey must match one of the
 * keys defined in ScoringService's event catalog (e.g. "completed_task").
 * The base value is looked up server-side — never trust a client-supplied score delta.
 */
public class ScoreEventRequest {

    @NotBlank
    @Pattern(regexp = "POSITIVE|NEGATIVE", message = "eventType must be POSITIVE or NEGATIVE")
    private String eventType;

    @NotBlank(message = "eventKey is required")
    private String eventKey;

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventKey() { return eventKey; }
    public void setEventKey(String eventKey) { this.eventKey = eventKey; }
}
