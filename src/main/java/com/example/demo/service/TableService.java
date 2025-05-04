// TableService.java
package com.example.demo.service;

import com.example.demo.dto.CreateTableRequest;
import com.example.demo.dto.AlterColumnRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
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

    /**
     * List all table names in the current database.
     * MySQL: uses DATABASE() to get the current schema.
     * If you’re on Postgres, change `table_schema = DATABASE()` to `table_schema = 'public'`.
     */
    public List<String> listAllTables() {
        String sql = ""
                + "SELECT table_name "
                + "FROM information_schema.tables "
                + "WHERE table_schema = DATABASE() "
                + "  AND table_type = 'BASE TABLE'";
        return jdbcTemplate.queryForList(sql, String.class);
    }
    /**
     * Return a map of columnName -> columnType for the given table.
     * MySQL: reads COLUMN_TYPE (includes varchar length, etc.)
     * Postgres users can swap COLUMN_TYPE for DATA_TYPE (and add character_maximum_length).
     */
    public Map<String, String> getColumnDefinitions(String tableName) {
        String sql = ""
                + "SELECT column_name, column_type "
                + "FROM information_schema.columns "
                + "WHERE table_schema = DATABASE() "
                + "  AND table_name = ?";

        return jdbcTemplate.query(sql, new Object[]{tableName}, rs -> {
            Map<String, String> cols = new LinkedHashMap<>();
            while (rs.next()) {
                cols.put(
                        rs.getString("column_name"),
                        rs.getString("column_type")
                );
            }
            return cols;
        });
    }
    public List<Map<String,Object>> getTableRows(String tableName) {
        // be VERY careful in prod—sanitize tableName to avoid SQL injection
        String sql = "SELECT * FROM " + tableName;
        return jdbcTemplate.queryForList(sql);
    }


}
