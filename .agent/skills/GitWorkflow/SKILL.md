---
name: GitWorkflow
description: Guide for the 'Main + Develop' Git strategy, including daily work, releases, and hotfixes.
---

# Git Workflow Guide

This skill directs the agent on how to manage the Git repository using the **Main + Develop** strategy.

## Core Branches

| Branch | Purpose | Rules |
| :--- | :--- | :--- |
| **`main`** | **Production**. Stable code only. | NO direct pushes. Only merge from `develop`. |
| **`develop`** | **Development**. Work-in-progress. | Default working branch. Test here locally. |

## 1. Daily Development Workflow
**Goal**: Make changes, test them, and save them.

1.  **Start from Develop**:
    ```bash
    git checkout develop
    git pull origin develop
    ```
2.  **Make Changes**: Edit files, run tests.
3.  **Commit**:
    ```bash
    git add .
    git commit -m "Description of feature or fix"
    ```
4.  **Push**:
    ```bash
    git push origin develop
    ```

## 2. Release Workflow
**Goal**: Move tested code from Development to Production.

1.  **Verify Develop**: Ensure `develop` passes all tests locally.
2.  **Switch to Main**:
    ```bash
    git checkout main
    git pull origin main  # Ensure local main is up to date
    ```
3.  **Merge Develop**:
    ```bash
    git merge develop
    ```
4.  **Push to Production**:
    ```bash
    git push origin main
    ```
    *(This triggers the ability to pull on PythonAnywhere)*

## 3. Hotfix Workflow
**Goal**: Fix a critical production bug *without* releasing unfinished work from `develop`.

1.  **Branch from Main**:
    ```bash
    git checkout main
    git checkout -b hotfix/critical-bug-name
    ```
2.  **Fix & Commit**: Make the minimal necessary fix.
3.  **Merge to Main (Release)**:
    ```bash
    git checkout main
    git merge hotfix/critical-bug-name
    git push origin main
    ```
4.  **Backport to Develop (Sync)**:
    ```bash
    git checkout develop
    git merge hotfix/critical-bug-name
    git push origin develop
    ```
5.  **Cleanup**:
    ```bash
    git branch -d hotfix/critical-bug-name
    ```

## 4. Conflict Resolution
If a merge conflict occurs during `git merge develop`:
1.  **Don't Panic**.
2.  Open the conflicted files and look for `<<<<<<<`.
3.  Decide which code to keep (usually the new code from `develop`).
4.  `git add [file]`
5.  `git commit` (to finish the merge).
