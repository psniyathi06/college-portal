import sys
import os

# Add ml-flask to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'college-portal/ml-flask')))

from model import RiskModel

def test():
    m = RiskModel()
    
    # Mock data
    marks = [
        {"subject": "Math", "examType": "MID-1", "marks": 10}, 
    ]
    
    # Check if method accepts 2 args
    try:
        att, risks = m.calculate_risk(90, marks)
        print("Risks Found:")
        for r in risks:
            print(f"- {r}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
