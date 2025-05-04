package com.example.demo.dto;

import java.util.Map;

public class UpdateRequest {
    // which rows to update (column→value)
    private Map<String, Object> filter;
    // what to set on those rows
    private Map<String, Object> changes;

    public Map<String, Object> getFilter()  { return filter; }
    public void setFilter(Map<String, Object> filter) { this.filter = filter; }

    public Map<String, Object> getChanges() { return changes; }
    public void setChanges(Map<String, Object> changes) { this.changes = changes; }
}
