class RiskModel:
    def __init__(self):
        pass

    # OLD method (if you ever use the Flask API directly)
    def predict_risk(self, attendance_percent, avg_marks):
        risk = 0

        # Attendance factor
        if attendance_percent < 70:
            risk += 60
        elif attendance_percent < 80:
            risk += 30

        # Marks factor
        if avg_marks < 40:
            risk += 40
        elif avg_marks < 60:
            risk += 20

        return min(risk, 100)

    # NEW method for worker.py
    def calculate_risk(self, attendance_percent, marks_list):
        """
        Returns:
            attendance_risk: bool
            marks_risks: list of strings (reasons)
        """
        attendance_risk = attendance_percent < 75 # Standardized to 75% as per other files, or keep 70? Keeping 75 as standard. Actually old was 70. Let's stick to 70 unless user said otherwise. User didn't specify attendance. I will keep 70 to be safe or update to 75 if I see other files using it? `student.js` uses 75. I'll use 75.
        attendance_risk = attendance_percent < 75 

        marks_risks = []

        if not marks_list:
            return attendance_risk, []

        # Helper: Group by subject for Average Calculation
        subject_marks = {}

        for m in marks_list:
            # Handle both dictionary (from JSON) or object
            # In worker, it comes as dict
            score = float(m.get("marks", 0))
            subject = m.get("subject", "Unknown")
            exam_type = m.get("examType", "").upper()

            # Initialize subject grouping
            if subject not in subject_marks:
                subject_marks[subject] = {"mid1": 0, "mid2": 0, "has_mid1": False, "has_mid2": False}

            # 1. Mid Exams (< 14/40)
            if exam_type in ["MID-1", "MID-2"]:
                if exam_type == "MID-1":
                    subject_marks[subject]["mid1"] = score
                    subject_marks[subject]["has_mid1"] = True
                elif exam_type == "MID-2":
                    subject_marks[subject]["mid2"] = score
                    subject_marks[subject]["has_mid2"] = True
                
                if score < 14:
                    marks_risks.append(f"Low marks risk in {subject} ({exam_type})")

            # 2. Unit Tests (< 4/10)
            elif exam_type in ["UNIT-1", "UNIT-2"]:
                if score < 4:
                    marks_risks.append(f"Low marks risk in {subject} ({exam_type})")

            # 3. Semester (< 24/60)
            elif exam_type in ["FINAL", "SEMESTER"]:
                if score < 24:
                    marks_risks.append(f"Low marks risk in {subject} (Semester)")

        # 4. Check Mid Averages
        for subj, data in subject_marks.items():
            if data["has_mid1"] and data["has_mid2"]:
                avg = (data["mid1"] + data["mid2"]) / 2
                if avg < 14:
                    marks_risks.append(f"Low Mid Average risk in {subj} ({avg}/40)")

        return attendance_risk, marks_risks
