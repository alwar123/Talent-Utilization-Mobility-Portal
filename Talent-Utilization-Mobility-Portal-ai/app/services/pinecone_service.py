"""
pinecone_service.py — Helpers for upserting and managing employee vectors in Pinecone.

Called when:
- A new employee completes profile setup  (upsert)
- An employee updates skills/experience   (upsert)
- An employee account is deleted          (delete)
"""

from app.config import embedder, pinecone_index


def _build_skill_summary(employee: dict) -> str:
    """
    Build a plain-text skill summary string used as the Pinecone metadata
    and as context passed to Groq for explanations.
    """
    parts = []

    # Skills with proficiency
    skills = employee.get("skills", [])
    if skills:
        skill_strs = [f"{s['name']} ({s.get('proficiency', 'Intermediate')})" for s in skills]
        parts.append("Skills: " + ", ".join(skill_strs))

    # Hidden / AI-detected skills
    hidden = employee.get("hiddenSkills", [])
    if hidden:
        parts.append("AI-detected: " + ", ".join(hidden))

    # Experience titles
    experience = employee.get("experience", [])
    if experience:
        titles = [f"{e.get('jobTitle', '')} at {e.get('company', '')}" for e in experience[:3]]
        parts.append("Experience: " + "; ".join(titles))

    # Education
    education = employee.get("education", [])
    if education:
        edu_strs = [f"{e.get('degree', '')} from {e.get('institution', '')}" for e in education[:2]]
        parts.append("Education: " + "; ".join(edu_strs))

    # Certifications
    certs = employee.get("certifications", [])
    if certs:
        cert_names = [c.get("name", "") for c in certs[:4]]
        parts.append("Certifications: " + ", ".join(cert_names))

    # Projects — technology summary
    projects = employee.get("projects", [])
    if projects:
        techs = []
        for p in projects[:3]:
            techs.extend(p.get("technologiesUsed", []))
        if techs:
            parts.append("Project Technologies: " + ", ".join(set(techs)))

    return " | ".join(parts)


def upsert_employee_vector(employee: dict) -> None:
    """
    Embed a skill summary and upsert the vector into Pinecone.
    The vector ID is the employee's MongoDB _id (as string).

    Args:
        employee: dict with at minimum { "_id", "department", "skills" }
    """
    employee_id   = str(employee["_id"])
    department    = employee.get("department", "")
    skill_summary = _build_skill_summary(employee)

    if not skill_summary.strip():
        print(f"[pinecone_service] Skipping upsert for {employee_id} — empty skill summary")
        return

    vector = embedder.encode(skill_summary).tolist()

    pinecone_index.upsert(
        vectors=[
            {
                "id":       employee_id,
                "values":   vector,
                "metadata": {
                    "department":    department,
                    "skill_summary": skill_summary,
                    "full_name":     employee.get("fullName", ""),
                    "email":         employee.get("email", ""),
                },
            }
        ]
    )
    print(f"[pinecone_service] Upserted vector for employee {employee_id}")


def delete_employee_vector(employee_id: str) -> None:
    """Remove an employee's vector from Pinecone."""
    pinecone_index.delete(ids=[employee_id])
    print(f"[pinecone_service] Deleted vector for employee {employee_id}")
