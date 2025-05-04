package com.example.demo.service;
import java.util.List;
import java.util.Map;

public interface DynamicTableService {
    /**
     * Insert a single row into the given table.
     * @param tableName name of the table (must already exist)
     * @param rowData   map of column→value pairs
     * @throws IllegalArgumentException if tableName invalid or rowData empty
     * @throws DataAccessException      on SQL errors
     */
    void insertRow(String tableName, Map<String, Object> rowData);

    List<Map<String, Object>> getRows(String tableName);
//    void updateRow(String tableName, Object id, Map<String, Object> rowData);
//    void deleteRow(String tableName, Object id);
    void updateRows(String tableName,
                    Map<String,Object> filter,
                    Map<String,Object> changes);
    void deleteRows(String tableName, Map<String, Object> filter);
}


