# Data Persistence & Database - Test Cases

## Overview
Database operations including time entry storage, data retrieval, summary generation, and data integrity verification.

## Test Cases

### TC-DB-001: Basic Data Entry Storage
**Objective:** Verify that time entries are stored correctly in database
**Prerequisites:** Extension installed, database accessible
**Steps:**
1. Start tracking activity
2. Work for known duration (e.g., 5 minutes)
3. Stop tracking or trigger save
4. Verify entry exists in database
5. Check entry data accuracy (project, duration, timestamp)

**Expected Result:**
- Time entry saved to database
- Duration matches actual time tracked
- Project name stored correctly
- Timestamp accurate to when session occurred
- All required fields populated

**Priority:** High
**Category:** Data Storage

---

### TC-DB-002: Multiple Session Storage
**Objective:** Verify multiple tracking sessions are stored independently
**Prerequisites:** Extension installed and activated
**Steps:**
1. Complete first tracking session (Project A, 10 minutes)
2. Stop tracking and start new session
3. Complete second session (Project B, 15 minutes)
4. Query database for both entries
5. Verify both sessions stored correctly

**Expected Result:**
- Two separate database entries created
- Each entry has correct project and duration
- Sessions don't interfere with each other
- Chronological order maintained

**Priority:** High
**Category:** Multi-Session Storage

---

### TC-DB-003: Data Retrieval Accuracy
**Objective:** Verify stored data can be retrieved accurately
**Prerequisites:** Extension installed, sample data in database
**Steps:**
1. Create several test sessions with known data
2. Use extension to retrieve today's total
3. Retrieve project-specific totals
4. Query for date ranges
5. Verify all retrieved data matches stored data

**Expected Result:**
- All queries return correct data
- Filtering by date works correctly
- Project-specific queries accurate
- No data corruption during retrieval
- Performance acceptable for large datasets

**Priority:** High
**Category:** Data Retrieval

---

### TC-DB-004: Database Schema Integrity
**Objective:** Verify database schema is correct and consistent
**Prerequisites:** Extension installed, database access
**Steps:**
1. Examine database structure
2. Verify all required tables exist
3. Check column types and constraints
4. Verify indexes are properly created
5. Test schema migrations if applicable

**Expected Result:**
- Database schema matches expected structure
- All necessary tables and columns present
- Data types appropriate for stored information
- Proper indexing for performance
- Schema versioning handled correctly

**Priority:** Medium
**Category:** Schema Management

---

### TC-DB-005: Data Persistence Across Restarts
**Objective:** Verify data persists when VS Code is restarted
**Prerequisites:** Extension installed with existing data
**Steps:**
1. Create tracking sessions and verify data saved
2. Close VS Code completely
3. Restart VS Code and extension
4. Verify all previous data still accessible
5. Add new session and verify it's stored

**Expected Result:**
- All previous data available after restart
- No data loss during VS Code shutdown
- Extension reconnects to database correctly
- New data can be added after restart
- Database location remains consistent

**Priority:** High
**Category:** Persistence

---

### TC-DB-006: Large Dataset Performance
**Objective:** Verify database performance with large amounts of data
**Prerequisites:** Extension installed, ability to generate test data
**Steps:**
1. Generate large dataset (1000+ entries)
2. Test data retrieval performance
3. Query for various date ranges
4. Test summary calculations
5. Monitor memory usage during operations

**Expected Result:**
- Queries complete in reasonable time (<2 seconds)
- Memory usage remains stable
- No performance degradation with large datasets
- Summary calculations efficient
- Database operations don't block UI

**Priority:** Medium
**Category:** Performance

---

### TC-DB-007: Concurrent Access Handling
**Objective:** Verify database handles concurrent operations correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start tracking session
2. Trigger manual save while tracking continues
3. Perform multiple rapid operations
4. Verify data consistency
5. Check for any locking issues

**Expected Result:**
- No data corruption from concurrent access
- All operations complete successfully
- Proper locking prevents conflicts
- Data remains consistent throughout
- No database errors or exceptions

**Priority:** Medium
**Category:** Concurrency

---

### TC-DB-008: Data Migration and Upgrades
**Objective:** Verify database schema upgrades work correctly
**Prerequisites:** Extension with older database version
**Steps:**
1. Install extension with older database schema
2. Create sample data
3. Upgrade to newer extension version
4. Verify data migration occurs
5. Check data integrity after migration

**Expected Result:**
- Migration completes without errors
- All existing data preserved
- New schema features available
- No data loss during migration process
- Backward compatibility maintained where possible

**Priority:** Low
**Category:** Migration

---

### TC-DB-009: Error Recovery and Corruption Handling
**Objective:** Verify extension handles database errors gracefully
**Prerequisites:** Extension installed, ability to simulate database issues
**Steps:**
1. Simulate database corruption or access issues
2. Verify extension behavior during errors
3. Test recovery mechanisms
4. Verify user notification of issues
5. Test data backup/restore if available

**Expected Result:**
- Extension handles errors without crashing
- User informed of database issues appropriately
- Recovery mechanisms work when possible
- Data backup available for restoration
- Graceful degradation of functionality

**Priority:** Low
**Category:** Error Handling

---

### TC-DB-010: Date and Time Handling
**Objective:** Verify date/time storage and retrieval works correctly across timezones
**Prerequisites:** Extension installed, ability to change system timezone
**Steps:**
1. Create sessions in one timezone
2. Change system timezone
3. Verify existing data displays correctly
4. Create new sessions in new timezone
5. Test date range queries across timezone changes

**Expected Result:**
- Dates stored in consistent format
- Timezone changes don't corrupt existing data
- New data uses appropriate timezone
- Date queries work correctly regardless of timezone
- No confusion between local and UTC times

**Priority:** Medium
**Category:** Date/Time Handling

---

### TC-DB-011: Data Export and Import
**Objective:** Verify data can be exported and imported correctly
**Prerequisites:** Extension installed with sample data
**Steps:**
1. Export existing data to file
2. Verify export format and completeness
3. Clear database
4. Import previously exported data
5. Verify all data restored correctly

**Expected Result:**
- Export includes all relevant data
- Export format is standard and readable
- Import process completes without errors
- All data restored with correct values
- Export/import maintains data integrity

**Priority:** Low
**Category:** Data Portability

---

### TC-DB-012: Storage Location and Permissions
**Objective:** Verify database storage location is appropriate and accessible
**Prerequisites:** Extension installed on various operating systems
**Steps:**
1. Install extension and create data
2. Locate database storage directory
3. Verify permissions are correct
4. Test with restricted user accounts
5. Verify database location consistency

**Expected Result:**
- Database stored in appropriate user directory
- Permissions allow read/write access
- Works with restricted user accounts
- Location consistent across OS platforms
- No permission errors during operation

**Priority:** Low
**Category:** Storage Management

## Test Data Requirements
- Large datasets for performance testing (1000+ entries)
- Entries spanning multiple days/weeks/months
- Multiple projects and branches
- Various session durations

## Environment Setup
- VS Code with extension installed
- Database inspection tools
- Multiple operating systems for compatibility testing
- Performance monitoring tools
- Test data generation capabilities
