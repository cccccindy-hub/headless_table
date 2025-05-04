package com.example.demo.service.impl;

import com.example.demo.dto.CreateTableRequest;
import com.example.demo.dto.AlterColumnRequest;
import com.example.demo.service.DynamicTableService;
import com.example.demo.service.TableMetadataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DynamicTableServiceImpl implements DynamicTableService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TableMetadataService metadataService;

    public DynamicTableServiceImpl(NamedParameterJdbcTemplate jdbc,
                                   TableMetadataService metadataService) {
        this.jdbc = jdbc;
        this.metadataService = metadataService;
    }

    @Override
    @Transactional
    public void insertRow(String tableName, Map<String, Object> rowData) {
        if (rowData == null || rowData.isEmpty()) {
            throw new IllegalArgumentException("No data provided");
        }
        // 1) Validate table exists and columns are valid
        Set<String> validCols = metadataService.getColumns(tableName);
        if (validCols.isEmpty()) {
            throw new IllegalArgumentException("Table not found: " + tableName);
        }
        // 2) Retain only keys that exist in the table
        Map<String, Object> filtered = rowData.entrySet().stream()
                .filter(e -> validCols.contains(e.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        if (filtered.isEmpty()) {
            throw new IllegalArgumentException("No valid columns in payload");
        }

        // 3) Build SQL
        String columns = String.join(", ", filtered.keySet());
        String params  = filtered.keySet().stream()
                .map(k -> ":" + k)
                .collect(Collectors.joining(", "));
        String sql = String.format("INSERT INTO %s (%s) VALUES (%s)",
                tableName, columns, params);

        // 4) Execute
        SqlParameterSource namedParams = new MapSqlParameterSource(filtered);
        jdbc.update(sql, namedParams);
    }
    @Override
    @Transactional(readOnly = true)
    public List<Map<String,Object>> getRows(String tableName) {
        // optional: validate table exists
        Set<String> cols = metadataService.getColumns(tableName);
        if (cols.isEmpty()) {
            throw new IllegalArgumentException("Table not found: " + tableName);
        }
        // run a raw SELECT *; each row is a Map<columnName,value>
        String sql = "SELECT * FROM " + tableName;
        return jdbc.getJdbcTemplate().queryForList(sql);
    }
    @Override
    @Transactional
    public void updateRows(String tableName,
                           Map<String,Object> filter,
                           Map<String,Object> changes) {

        // validate columns exist
        Set<String> valid = metadataService.getColumns(tableName);
        Map<String,Object> f = filter.entrySet().stream()
                .filter(e -> valid.contains(e.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        Map<String,Object> c = changes.entrySet().stream()
                .filter(e -> valid.contains(e.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        if (f.isEmpty() || c.isEmpty()) {
            throw new IllegalArgumentException("Filter or changes contain no valid columns");
        }

        String setClause = c.keySet().stream()
                .map(col -> col + " = :chg_" + col)
                .collect(Collectors.joining(", "));
        String whereClause = f.keySet().stream()
                .map(col -> col + " = :flt_" + col)
                .collect(Collectors.joining(" AND "));

        // combine params with distinct names
        MapSqlParameterSource params = new MapSqlParameterSource();
        c.forEach((k,v)->params.addValue("chg_"+k, v));
        f.forEach((k,v)->params.addValue("flt_"+k, v));

        String sql = String.format(
                "UPDATE %s SET %s WHERE %s",
                tableName, setClause, whereClause
        );
        jdbc.update(sql, params);
    }

    @Override
    @Transactional
    public void deleteRows(String tableName, Map<String, Object> filter) {
        // 1) validate table & columns
        Set<String> validCols = metadataService.getColumns(tableName);
        Map<String, Object> f = filter.entrySet().stream()
                .filter(e -> validCols.contains(e.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        if (f.isEmpty()) {
            throw new IllegalArgumentException("Filter contains no valid columns");
        }

        // 2) build WHERE clause: col1 = :col1 AND col2 = :col2 …
        String whereClause = f.keySet().stream()
                .map(col -> col + " = :" + col)
                .collect(Collectors.joining(" AND "));

        // 3) execute DELETE
        String sql = String.format("DELETE FROM %s WHERE %s", tableName, whereClause);
        MapSqlParameterSource params = new MapSqlParameterSource();
        f.forEach(params::addValue);

        jdbc.update(sql, params);
    }
}
