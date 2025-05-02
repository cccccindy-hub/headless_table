package com.example.demo.controller;

import com.example.demo.dto.CreateTableRequest;
import com.example.demo.dto.AlterColumnRequest;
import com.example.demo.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.example.demo.dto.AlterColumnRequest;
import com.example.demo.service.TableService;
import org.springframework.jdbc.BadSqlGrammarException;

//import org.springframework.dao.BadSqlGrammarException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    @Autowired
    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    // Create a new table
    @PostMapping
    public ResponseEntity<String> createTable(@RequestBody CreateTableRequest request) {
        tableService.createTable(request);
        return ResponseEntity.ok("Table '" + request.getTableName() + "' created.");
    }

    // Add or ensure column (create table if absent)
    @PostMapping("/{tableName}/columns")
    public ResponseEntity<String> addOrEnsureColumn(
            @PathVariable String tableName,
            @RequestBody AlterColumnRequest request) {
        tableService.addColumn(tableName, request);
        return ResponseEntity.ok("Column '" + request.getColumnName() + "' ensured in '" + tableName + "'.");
    }

    // Rename an existing column
    @PutMapping("/{tableName}/columns/rename")
    public ResponseEntity<String> renameColumn(
            @PathVariable String tableName,
            @RequestBody AlterColumnRequest request) {

        // 1. Basic validation
        if (request.getColumnName() == null || request.getColumnName().isBlank() ||
                request.getNewColumnName() == null || request.getNewColumnName().isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body("Both 'columnName' and 'newColumnName' must be provided.");
        }

        try {
            // 2. Delegate to service (which now issues: ALTER TABLE ... RENAME COLUMN ...)
            tableService.renameColumn(tableName, request);

            // 3. Success response
            String msg = String.format(
                    "Column '%s' successfully renamed to '%s'.",
                    request.getColumnName(),
                    request.getNewColumnName()
            );
            return ResponseEntity.ok(msg);

        } catch (BadSqlGrammarException ex) {
            // 4a. SQL syntax or rename failure
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("SQL error during rename: " + ex.getSQLException().getMessage());

        } catch (Exception ex) {
            // 4b. Any other failure
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + ex.getMessage());
        }
    }

    // Drop a column
    @DeleteMapping("/{tableName}/columns/{columnName}")
    public ResponseEntity<String> dropColumn(
            @PathVariable String tableName,
            @PathVariable String columnName) {
        tableService.dropColumn(tableName, columnName);
        return ResponseEntity.ok("Column '" + columnName + "' dropped from '" + tableName + "'.");
    }
}