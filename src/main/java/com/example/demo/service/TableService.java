// TableService.java
package com.example.demo.service;

import com.example.demo.dto.CreateTableRequest;
import com.example.demo.dto.AlterColumnRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class TableService {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public TableService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createTable(CreateTableRequest request) {
        StringBuilder ddl = new StringBuilder();
        ddl.append("CREATE TABLE IF NOT EXISTS ")
                .append(request.getTableName())
                .append(" (");
        request.getColumns().forEach((name, type) ->
                ddl.append(name).append(" ").append(type).append(", ")
        );
        // remove trailing comma and space
        ddl.setLength(ddl.length() - 2);
        ddl.append(")");

        jdbcTemplate.execute(ddl.toString());
    }

    public boolean tableExists(String tableName) {
        String sql = "SELECT COUNT(*) FROM information_schema.tables " +
                "WHERE table_schema = DATABASE() AND table_name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, new Object[]{tableName}, Integer.class);
        return count != null && count > 0;
    }

    /**
     * Adds a column if the table exists; otherwise creates the table with this column.
     */
    public void addColumn(String tableName, AlterColumnRequest req) {
        if (!tableExists(tableName)) {
            // Table doesn't exist: create it with the single requested column
            CreateTableRequest ctr = new CreateTableRequest();
            ctr.setTableName(tableName);
            Map<String, String> cols = new LinkedHashMap<>();
            cols.put(req.getColumnName(), req.getColumnType());
            ctr.setColumns(cols);
            createTable(ctr);
            return;
        }
        String ddl = String.format(
                "ALTER TABLE %s ADD COLUMN %s %s",
                tableName,
                req.getColumnName(),
                req.getColumnType()
        );
        jdbcTemplate.execute(ddl);
    }

    public void renameColumn(String tableName, AlterColumnRequest req) {
        String ddl = String.format(
                // MySQL syntax requires specifying type on rename
                "ALTER TABLE %s RENAME COLUMN %s TO %s",
                tableName,
                req.getColumnName(),
                req.getNewColumnName()
//                req.getColumnType()
        );
        jdbcTemplate.execute(ddl);
    }

    public void dropColumn(String tableName, String columnName) {
        String ddl = String.format(
                "ALTER TABLE %s DROP COLUMN %s",
                tableName,
                columnName
        );
        jdbcTemplate.execute(ddl);
    }
}
