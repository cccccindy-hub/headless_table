package com.example.demo.controller;

import com.example.demo.dto.CreateTableRequest;
import com.example.demo.dto.AlterColumnRequest;
import com.example.demo.dto.UpdateRequest;
import com.example.demo.service.DynamicTableService;
import com.example.demo.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
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

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/tables")
public class DynamicTableController {

    private final TableService tableService;
    private final DynamicTableService dynamicService;

    public DynamicTableController(DynamicTableService dynamicService,
                                  TableService tableService) {
        this.dynamicService = dynamicService;
        this.tableService   = tableService;
    }

    /**
     * POST /api/tables/{tableName}/rows
     * Body: JSON object mapping column names → values
     */
    @PostMapping("/{tableName}/rows")
    public ResponseEntity<?> addRow(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> rowData) {
        try {
            dynamicService.insertRow(tableName, rowData);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException iae) {
            // e.g. tableName not found or empty rowData
            return ResponseEntity.badRequest()
                    .body(iae.getMessage());
        } catch (DataAccessException dae) {
            // SQL errors, type mismatches, etc.
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error inserting row: " + dae.getMessage());
        }
    }
    /** ← NEW: list all table names under this schema */
    @GetMapping
    public List<String> listTables() {
        return tableService.listAllTables();
    }

    /**
     * GET /api/tables/{tableName}/rows
     * Returns all rows from the specified table as a list of maps.
     */
    @GetMapping("/{tableName}/rows")
    public ResponseEntity<List<Map<String,Object>>> getRows(
            @PathVariable String tableName) {
        List<Map<String,Object>> rows = dynamicService.getRows(tableName);
        return ResponseEntity.ok(rows);
    }
//    @PostMapping("/{tableName}/rows")
//    @ResponseStatus(HttpStatus.CREATED)
//    public void insertRow(@PathVariable String tableName,
//                          @RequestBody Map<String, Object> rowData) {
//        dynamicService.insertRow(tableName, rowData);
//    }
@PutMapping("/{tableName}/rows")
public ResponseEntity<?> updateRows(
        @PathVariable String tableName,
        @RequestBody UpdateRequest req) {

    if (req.getFilter()  == null || req.getFilter().isEmpty()
            || req.getChanges() == null || req.getChanges().isEmpty()) {
        return ResponseEntity
                .badRequest()
                .body("Must supply non-empty filter and changes");
    }

    dynamicService.updateRows(tableName, req.getFilter(), req.getChanges());
    return ResponseEntity.ok().build();

    // ← new update endpoint
//    @PutMapping("/{tableName}/rows/{id}")
//    public void updateRow(@PathVariable String tableName,
//                          @PathVariable String id,
//                          @RequestBody Map<String, Object> rowData) {
//        dynamicService.updateRow(tableName, id, rowData);
    }

    // ← new delete endpoint
    @DeleteMapping("/{tableName}/rows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRows(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> filter) {
        if (filter == null || filter.isEmpty()) {
            throw new IllegalArgumentException("Must supply a non-empty filter");
        }
        dynamicService.deleteRows(tableName, filter);
    }
}

