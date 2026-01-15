import sys
import os

# Add ml-flask to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../college-portal/ml-flask')))

from model import RiskModel

def test():
    model = RiskModel()
    
    # Case 1: Mid-1 Low (< 14), Mid-2 Low (< 14), Avg Low (< 14)
    marks1 = [
        {"subject": "Math", "examType": "MID-1", "marks": 10}, # Risk
        {"subject": "Math", "examType": "MID-2", "marks": 10}, # Risk
    ]
    # Avg = 10 -> Risk
    
    # Case 2: Unit Test Low (< 4)
    marks2 = [
         {"subject": "Physics", "examType": "UNIT-1", "marks": 3} # Risk
    ]
    
    # Case 3: Semester Low (< 24)
    marks3 = [
        {"subject": "Chem", "examType": "FINAL", "marks": 20} # Risk
    ]
    
    # Case 4: Mid Avg Low BUT individual Not Low (e.g. 13 + 14 = 13.5)
    # Actually if Mid1 < 14 it triggers individual risk too.
    # Let's try 13 and 14. Avg = 13.5 (< 14).
    marks4 = [
        {"subject": "English", "examType": "MID-1", "marks": 13}, # Risk (<14)
        {"subject": "English", "examType": "MID-2", "marks": 14}  # No Risk (=14)
    ]
    # Avg = 13.5 -> Risk
    
    all_marks = marks1 + marks2 + marks3 + marks4
    
    att_risk, risks = model.calculate_risk(90, all_marks)
    
    print("Risks Found:")
    for r in risks:
        print(f"- {r}")

if __name__ == "__main__":
    test()
