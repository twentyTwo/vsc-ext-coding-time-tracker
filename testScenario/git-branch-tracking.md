# Git Branch Tracking - Test Cases

## Overview
Git branch tracking functionality including branch detection, session management per branch, and git repository monitoring.

## Test Cases

### TC-GIT-001: Basic Branch Detection
**Objective:** Verify that current git branch is detected correctly
**Prerequisites:** Extension installed, workspace is a git repository
**Steps:**
1. Open VS Code in a git repository
2. Check current branch using `git branch`
3. Start tracking activity
4. Verify extension detects correct branch name
5. Check status bar or logs for branch information

**Expected Result:**
- Extension correctly identifies current git branch
- Branch name is displayed/logged accurately
- Works with any valid git branch name

**Priority:** High
**Category:** Branch Detection

---

### TC-GIT-002: Branch Change Detection
**Objective:** Verify that branch changes are detected and sessions are managed correctly
**Prerequisites:** Extension installed, git repository with multiple branches
**Steps:**
1. Start tracking on branch A
2. Work for several minutes
3. Switch to branch B using `git checkout branch-B`
4. Continue working
5. Verify session saved for branch A and new session started for branch B

**Expected Result:**
- Current session saved when branch changes
- New session starts automatically on new branch
- Branch change is logged with proper timestamps
- No time loss during branch switch

**Priority:** High
**Category:** Branch Management

---

### TC-GIT-003: Multiple Branch Switches
**Objective:** Verify handling of multiple rapid branch switches
**Prerequisites:** Extension installed, git repository with 3+ branches
**Steps:**
1. Start tracking on branch A
2. Work for 2 minutes
3. Switch to branch B, work for 2 minutes
4. Switch to branch C, work for 2 minutes
5. Switch back to branch A
6. Verify all sessions are tracked separately

**Expected Result:**
- Each branch maintains separate time tracking
- Sessions are saved correctly for each branch
- Total time is accurate across all branches
- No session data mixing between branches

**Priority:** High
**Category:** Branch Management

---

### TC-GIT-004: Non-Git Repository Handling
**Objective:** Verify extension works correctly in non-git workspaces
**Prerequisites:** Extension installed, workspace without git initialization
**Steps:**
1. Open VS Code in a folder without .git directory
2. Start tracking activity
3. Verify extension functionality
4. Check that branch is marked as 'unknown' or similar

**Expected Result:**
- Extension works normally without git repository
- Branch field shows appropriate default value
- No errors or crashes related to missing git
- Time tracking functions normally

**Priority:** Medium
**Category:** Non-Git Support

---

### TC-GIT-005: Git Repository Initialization
**Objective:** Verify behavior when git is initialized in existing workspace
**Prerequisites:** Extension installed, non-git workspace open
**Steps:**
1. Start tracking in non-git workspace
2. Initialize git repository (`git init`)
3. Create and checkout a branch
4. Continue tracking
5. Verify extension adapts to new git repository

**Expected Result:**
- Extension detects git initialization
- Branch tracking starts working automatically
- Previous session data remains intact
- New sessions include branch information

**Priority:** Low
**Category:** Git Initialization

---

### TC-GIT-006: Branch Creation and Deletion
**Objective:** Verify handling of branch creation and deletion operations
**Prerequisites:** Extension installed, git repository
**Steps:**
1. Start tracking on main branch
2. Create new branch and switch to it
3. Work on new branch
4. Switch back to main
5. Delete the created branch
6. Verify session data integrity

**Expected Result:**
- New branch creation detected correctly
- Sessions tracked separately for new branch
- Branch deletion doesn't affect stored session data
- Historical data remains accessible

**Priority:** Medium
**Category:** Branch Lifecycle

---

### TC-GIT-007: Git Watcher Performance
**Objective:** Verify git monitoring doesn't impact VS Code performance
**Prerequisites:** Extension installed, git repository with many branches
**Steps:**
1. Open large git repository
2. Start tracking activity
3. Monitor CPU usage and memory
4. Perform normal development activities
5. Check for performance issues

**Expected Result:**
- Git monitoring has minimal performance impact
- No noticeable lag in VS Code
- Memory usage remains stable
- Branch checking interval is reasonable (5 seconds)

**Priority:** Medium
**Category:** Performance

---

### TC-GIT-008: Concurrent Git Operations
**Objective:** Verify extension handles concurrent git operations correctly
**Prerequisites:** Extension installed, git repository
**Steps:**
1. Start tracking activity
2. Perform git operations from command line while tracking
3. Use VS Code git features simultaneously
4. Switch branches using different methods
5. Verify branch detection remains accurate

**Expected Result:**
- Extension correctly detects external git operations
- No conflicts with VS Code built-in git features
- Branch changes detected regardless of method used
- Locking mechanism prevents concurrent issues

**Priority:** Medium
**Category:** Concurrency

---

### TC-GIT-009: Corrupted Git Repository
**Objective:** Verify graceful handling of git repository issues
**Prerequisites:** Extension installed, ability to simulate git issues
**Steps:**
1. Start tracking in working git repository
2. Simulate git repository corruption or issues
3. Verify extension behavior
4. Restore git repository
5. Check that tracking resumes normally

**Expected Result:**
- Extension handles git errors gracefully
- No crashes or unhandled exceptions
- Fallback to 'unknown' branch when git fails
- Automatic recovery when git issues resolved

**Priority:** Low
**Category:** Error Handling

---

### TC-GIT-010: Branch Name Edge Cases
**Objective:** Verify handling of unusual branch names
**Prerequisites:** Extension installed, git repository
**Steps:**
1. Create branches with special characters in names
2. Create branches with very long names
3. Create branches with spaces or unusual characters
4. Switch between these branches while tracking
5. Verify all branch names are handled correctly

**Expected Result:**
- All valid git branch names are supported
- Special characters don't cause issues
- Long branch names are handled appropriately
- No encoding or display issues

**Priority:** Low
**Category:** Edge Cases

---

### TC-GIT-011: Detached HEAD State
**Objective:** Verify behavior in git detached HEAD state
**Prerequisites:** Extension installed, git repository
**Steps:**
1. Start tracking on normal branch
2. Checkout a specific commit (detached HEAD)
3. Continue tracking activity
4. Switch back to normal branch
5. Verify session management

**Expected Result:**
- Detached HEAD state is detected and handled
- Sessions are managed appropriately
- Branch field shows appropriate indicator for detached state
- Normal operation resumes when returning to branch

**Priority:** Low
**Category:** Git States

---

### TC-GIT-012: Submodule Support
**Objective:** Verify tracking works correctly with git submodules
**Prerequisites:** Extension installed, git repository with submodules
**Steps:**
1. Open workspace with git submodules
2. Work in main repository
3. Work in submodule directories
4. Switch branches in main repo and submodules
5. Verify tracking behavior

**Expected Result:**
- Main repository and submodules tracked appropriately
- Branch detection works for submodules
- Sessions managed correctly across repository boundaries
- No confusion between main repo and submodule branches

**Priority:** Low
**Category:** Submodules

## Test Data Requirements
- Git repository with multiple branches
- Branches with various naming patterns
- Large repository for performance testing
- Repository with submodules (optional)

## Environment Setup
- Git installed and configured
- VS Code with git support enabled
- Test repositories with diverse branch structures
- Command line access for git operations
