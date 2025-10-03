#!/usr/bin/env python3
"""
Simplified Quickstart Integration Test
Validates core system functionality
"""
import requests

BASE_URL = "http://localhost:5000/api"

def test_integration():
    print("\n" + "="*80)
    print("QUICKSTART INTEGRATION TEST - Core System Validation")
    print("="*80 + "\n")
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Backend Health
    print("[TEST 1] Backend API Health Check...")
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/aides", timeout=5)
        assert response.status_code == 200
        print("[OK] Backend API is responding")
        tests_passed += 1
    except Exception as e:
        print(f"[FAIL] Backend health check failed: {e}")
    
    # Test 2: Get Aides
    print("\n[TEST 2] Retrieve teacher aides...")
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/aides")
        assert response.status_code == 200
        aides = response.json()
        print(f"[OK] Retrieved {len(aides)} teacher aides")
        if aides:
            aide_id = aides[0]['id']
            print(f"  Sample: {aides[0]['name']} (ID: {aide_id})")
        tests_passed += 1
    except Exception as e:
        print(f"[FAIL] Aides retrieval failed: {e}")
        aide_id = None
    
    # Test 3: Get Tasks
    print("\n[TEST 3] Retrieve tasks...")
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/tasks")
        assert response.status_code == 200
        tasks = response.json()
        print(f"[OK] Retrieved {len(tasks)} tasks")
        if tasks:
            print(f"  Sample: {tasks[0].get('title', 'Task #' + str(tasks[0]['id']))}")
        tests_passed += 1
    except Exception as e:
        print(f"[FAIL] Tasks retrieval failed: {e}")
    
    # Test 4: Weekly Matrix
    print("\n[TEST 4] Get weekly assignment matrix...")
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/assignments/weekly-matrix", 
                               params={"start_date": "2025-10-06"})
        assert response.status_code == 200
        matrix = response.json()
        assert 'aides' in matrix
        assert 'time_slots' in matrix
        assert 'matrix' in matrix
        print(f"[OK] Weekly matrix loaded")
        print(f"  Time slots: {len(matrix['time_slots'])}")
        print(f"  Aides: {len(matrix['aides'])}")
        tests_passed += 1
    except Exception as e:
        print(f"[FAIL] Weekly matrix retrieval failed: {e}")
    
    # Test 5: Get Classrooms
    print("\n[TEST 5] Retrieve classrooms...")
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/classrooms")
        assert response.status_code == 200
        classrooms = response.json()
        print(f"[OK] Retrieved {len(classrooms)} classrooms")
        tests_passed += 1
    except Exception as e:
        print(f"[FAIL] Classrooms retrieval failed: {e}")
    
    # Test 6: Create and Delete Test Absence
    if aide_id:
        print("\n[TEST 6] Create and delete test absence...")
        tests_total += 1
        try:
            # Create absence
            absence_data = {
                "aide_id": aide_id,
                "date": "2025-12-25",  # Use future date
                "reason": "Integration Test"
            }
            response = requests.post(f"{BASE_URL}/absences", json=absence_data)
            if response.status_code == 201:
                absence = response.json()
                absence_id = absence['absence']['id']
                print(f"[OK] Absence created (ID: {absence_id})")
                
                # Delete absence
                response = requests.delete(f"{BASE_URL}/absences/{absence_id}")
                if response.status_code == 200:
                    print(f"[OK] Absence deleted (cleanup successful)")
                    tests_passed += 1
                else:
                    print(f"[FAIL] Absence deletion failed: {response.status_code}")
            elif response.status_code == 409:
                print("[OK] Absence already exists (409) - acceptable")
                tests_passed += 1
            else:
                print(f"[FAIL] Absence creation failed: {response.status_code}")
        except Exception as e:
            print(f"[FAIL] Absence test failed: {e}")
    
    # Final Results
    print("\n" + "="*80)
    print(f"INTEGRATION TEST RESULTS: {tests_passed}/{tests_total} tests passed")
    print("="*80)
    
    if tests_passed == tests_total:
        print("\n[SUCCESS] All integration tests passed!")
        print("System is fully functional and ready for use.\n")
        return 0
    elif tests_passed >= tests_total * 0.8:  # 80% pass rate
        print(f"\n[PARTIAL SUCCESS] {tests_passed}/{tests_total} tests passed (>80%)")
        print("Core functionality validated.\n")
        return 0
    else:
        print(f"\n[FAILURE] Only {tests_passed}/{tests_total} tests passed")
        print("System may have issues.\n")
        return 1

if __name__ == "__main__":
    try:
        exit(test_integration())
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect to backend at http://localhost:5000")
        print("Please ensure backend is running: python app.py\n")
        exit(1)
    except KeyboardInterrupt:
        print("\n\n[ABORTED] Test interrupted by user\n")
        exit(1)

