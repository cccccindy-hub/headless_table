package com.example.demo.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class TableMetadataService {
    private final JdbcTemplate jdbc;
    public TableMetadataService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public Set<String> getColumns(String tableName) {
        String sql = """
            SELECT COLUMN_NAME
              FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
        """;
        return new HashSet<>(jdbc.queryForList(sql, String.class, tableName));
    }
}

