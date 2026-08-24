#!/usr/bin/env python3
"""
Placement Question Dataset Extraction, Normalization, and Deduplication Script
Extracts questions from 7 approved repositories and produces a final CSV.
"""

import csv
import hashlib
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import pandas as pd

# ─── Configuration ───────────────────────────────────────────────────────────────

BASE_DIR = Path(r"C:\0\Coding\Final Year Projects\get-selected\repos")
OUTPUT_DIR = Path(r"C:\0\Coding\Final Year Projects\get-selected")

CSV_COLUMNS = [
    "id", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d",
    "correct_answer", "explanation", "subject", "topic", "subtopic", "difficulty",
    "skills", "position_tags", "company_tags", "content_category",
    "source_url", "source_file"
]

# ─── Stats tracking ──────────────────────────────────────────────────────────────

stats = {
    "raw_discovered": 0,
    "extracted": 0,
    "rejected": 0,
    "duplicates_removed": 0,
    "by_subject": defaultdict(int),
    "by_type": defaultdict(int),
    "by_difficulty": defaultdict(int),
    "by_company": defaultdict(int),
    "by_position": defaultdict(int),
    "by_source": defaultdict(int),
    "missing_explanation": 0,
    "missing_difficulty": 0,
    "requires_review": 0,
    "source_files_processed": 0,
}

# ─── Utility Functions ────────────────────────────────────────────────────────────

def normalize_text(text):
    """Normalize text for comparison/dedup."""
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'\s+', ' ', t)
    t = t.lower()
    t = t.replace('\u2019', "'").replace('\u2018', "'")
    t = t.replace('\u201c', '"').replace('\u201d', '"')
    t = t.replace('\u2013', '-').replace('\u2014', '-')
    t = t.replace('\u2026', '...')
    t = re.sub(r'[^\w\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def clean_text(text):
    """Clean text for storage in CSV."""
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'<[^>]+>', '', t)
    t = t.replace('\u2019', "'").replace('\u2018', "'")
    t = t.replace('\u201c', '"').replace('\u201d', '"')
    t = t.replace('\u2013', '-').replace('\u2014', '-')
    t = t.replace('\u2026', '...')
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def content_hash(text):
    """Generate a hash for deduplication."""
    norm = normalize_text(text)
    if not norm:
        return None
    return hashlib.md5(norm.encode('utf-8')).hexdigest()

def make_record(**kwargs):
    """Create a record with all columns, filling missing with empty."""
    rec = {col: "" for col in CSV_COLUMNS}
    rec.update(kwargs)
    return rec

def classify_subject(topic, question_text="", source=""):
    """Classify into subject based on topic and content."""
    t = (topic or "").lower()
    q = (question_text or "").lower()
    s = (source or "").lower()

    if any(x in t for x in ['sql', 'database', 'dbms', 'query']):
        return "SQL"
    if any(x in t for x in ['arrays', 'strings', 'linked list', 'stack', 'queue',
                              'trees', 'graphs', 'sorting', 'searching', 'recursion',
                              'dynamic programming', 'programming', 'binary tree',
                              'binary search', 'heap', 'trie', 'backtracking',
                              'greedy', 'divide', 'matrix', 'bit', 'algorithm',
                              'dsa', 'coding']):
        return "Coding"
    if any(x in t for x in ['aptitude', 'quantitative', 'numerical', 'percent',
                              'profit', 'loss', 'ratio', 'proportion', 'time & work',
                              'time speed', 'probability', 'permutation', 'combination',
                              'number system', 'averages', 'interest', 'arithmetic',
                              'data interpretation', 'mensuration', 'statistics',
                              'series', 'hcf', 'lcm', 'pipes', 'cistern']):
        return "Aptitude"
    if any(x in t for x in ['logical', 'reasoning', 'blood relation', 'syllogism',
                              'seating', 'direction', 'analogy', 'coding-decoding',
                              'puzzle', 'statement', 'conclusion', 'inequality',
                              'ranking', 'order']):
        return "Logical Reasoning"
    if any(x in t for x in ['verbal', 'english', 'reading', 'comprehension',
                              'grammar', 'vocabulary', 'synonym', 'antonym',
                              'sentence', 'para jumble', 'fill in']):
        return "Verbal Ability"
    if any(x in t for x in ['react', 'sap', 'devops', 'aiml', 'ai/ml',
                              'machine learning', 'nlp', 'deep learning',
                              'docker', 'kubernetes', 'ci/cd', 'abap',
                              'computer network', 'operating system', 'oop',
                              'software engineering', 'computer fundamentals',
                              'html', 'css', 'javascript', 'web']):
        return "Technical"
    if any(x in t for x in ['hr', 'interview']):
        return "Technical"

    if q:
        if any(x in q for x in ['select ', 'insert ', 'update ', 'delete ', 'create table',
                                  'join', 'where ', 'group by', 'having ']):
            return "SQL"

    return "Technical"

def classify_topic(topic, question_text="", content_category=""):
    """Standardize topic names."""
    t = (topic or "").lower()

    topic_map = {
        'tcs numerical': 'Aptitude',
        'tcs reasoning': 'Logical Reasoning',
        'tcs verbal': 'Verbal Ability',
        'tcs programming': 'Programming Fundamentals',
        'numerical ability': 'Aptitude',
        'verbal ability': 'Verbal Ability',
        'reasoning ability': 'Logical Reasoning',
        'advanced coding': 'Coding',
        'advanced quantitative': 'Aptitude',
        'advanced logical': 'Logical Reasoning',
        'advanced numerical': 'Aptitude',
        'arrays': 'Arrays',
        'strings': 'Strings',
        'linked list': 'Linked Lists',
        'linked lists': 'Linked Lists',
        'stack': 'Stack',
        'queue': 'Queue',
        'trees': 'Trees',
        'binary tree': 'Trees',
        'binary search tree': 'Trees',
        'graphs': 'Graphs',
        'sorting': 'Sorting',
        'searching': 'Searching',
        'recursion': 'Recursion',
        'dynamic programming': 'Dynamic Programming',
        'backtracking': 'Backtracking',
        'heap': 'Heap',
        'trie': 'Trie',
        'greedy': 'Greedy',
        'divide & conquer': 'Divide & Conquer',
        'divide and conquer': 'Divide & Conquer',
        'matrix': 'Matrix',
        'binary': 'Bit Manipulation',
        'bit manipulation': 'Bit Manipulation',
        'puzzles': 'Puzzles',
        'algorithms': 'Algorithms',
        'time complexity': 'Time Complexity',
        'ml basics': 'Machine Learning',
        'machine learning': 'Machine Learning',
        'deep learning': 'Deep Learning',
        'nlp': 'NLP',
        'ai & ml': 'AI/ML',
        'aiml': 'AI/ML',
        'react': 'React',
        'hooks & state': 'React Hooks',
        'sap': 'SAP',
        'abap programming': 'SAP ABAP',
        'devops': 'DevOps',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'ci/cd': 'CI/CD',
        'dbms': 'DBMS',
        'database': 'DBMS',
        'computer networks': 'Computer Networks',
        'operating systems': 'Operating Systems',
        'oops': 'OOP',
        'oops concepts': 'OOP',
        'software engineering': 'Software Engineering',
        'computer fundamentals': 'Computer Fundamentals',
        'html': 'HTML/CSS',
        'css': 'HTML/CSS',
        'javascript': 'JavaScript',
        'web technologies': 'Web Technologies',
        'cloud computing': 'Cloud Computing',
        'cybersecurity': 'Cybersecurity',
    }

    for key, val in topic_map.items():
        if key in t:
            return val

    if topic:
        return topic.strip().title()
    return "General"

def classify_difficulty(diff_from_source):
    """Normalize difficulty."""
    if not diff_from_source:
        return "Unrated"
    d = str(diff_from_source).strip().lower()
    if d in ('easy', '1', 'simple', 'basic'):
        return "Easy"
    if d in ('medium', '2', 'moderate', 'intermediate'):
        return "Medium"
    if d in ('hard', '3', 'difficult', 'tough', 'advanced'):
        return "Hard"
    return "Unrated"

def get_position_tags(subject, topic, question_text=""):
    """Assign position tags based on content."""
    s = (subject or "").lower()
    t = (topic or "").lower()
    q = (question_text or "").lower()

    positions = set()

    if s == 'coding' or s == 'sql':
        positions.update(["Software Engineer", "Backend Developer", "Full Stack Developer"])
    if s == 'aptitude' or s == 'logical reasoning' or s == 'verbal ability':
        positions.update(["Software Engineer", "Backend Developer", "Frontend Developer",
                          "Full Stack Developer", "Data Analyst"])
    if s == 'technical':
        if any(x in t for x in ['react', 'javascript', 'html', 'css', 'frontend', 'web']):
            positions.add("Frontend Developer")
            positions.add("Full Stack Developer")
        elif any(x in t for x in ['sap', 'devops', 'docker', 'kubernetes']):
            positions.update(["Backend Developer", "Full Stack Developer"])
        elif any(x in t for x in ['machine learning', 'ai', 'nlp', 'deep learning']):
            positions.update(["AI/ML Engineer", "Data Scientist"])
        else:
            positions.update(["Software Engineer", "Backend Developer", "Full Stack Developer"])

    if any(x in q for x in ['sql', 'database', 'query', 'select']):
        positions.update(["Data Analyst", "Backend Developer"])

    if not positions:
        positions.update(["Software Engineer", "Backend Developer", "Frontend Developer",
                          "Full Stack Developer"])

    return "|".join(sorted(positions))


# ─── Source 1: Prepmaster ────────────────────────────────────────────────────────

def extract_prepmaster():
    """Extract questions from Prepmaster JS data files."""
    print("=== Extracting from Prepmaster ===")
    records = []
    data_dir = BASE_DIR / "Prepmaster" / "src" / "data"

    js_files = {
        "tcs-numerical.js": ("TCS", "Aptitude", "TCS Numerical"),
        "tcs-reasoning.js": ("TCS", "Logical Reasoning", "TCS Reasoning"),
        "tcs-verbal.js": ("TCS", "Verbal Ability", "TCS Verbal"),
        "tcs-programming.js": ("TCS", "Technical", "TCS Programming"),
        "aiml-questions.js": ("", "Technical", "AI & ML"),
        "devops-questions.js": ("", "Technical", "DevOps"),
        "react-questions.js": ("", "Technical", "React"),
        "sap-questions.js": ("", "Technical", "SAP"),
    }

    # Map section -> (subject, topic)
    section_subject_map = {
        "Numerical Ability": ("Aptitude", "Aptitude"),
        "Reasoning Ability": ("Logical Reasoning", "Logical Reasoning"),
        "Verbal Ability": ("Verbal Ability", "Verbal Ability"),
        "Programming Logic": ("Technical", "Programming Fundamentals"),
    }

    for fname, (company, raw_subject, section_name) in js_files.items():
        fpath = data_dir / fname
        if not fpath.exists():
            print(f"  Warning: {fname} not found")
            continue

        content = fpath.read_text(encoding='utf-8')

        json_match = re.search(r'export\s+const\s+\w+\s*=\s*(\[.*?\]);', content, re.DOTALL)
        if not json_match:
            json_match = re.search(r'export\s+default\s+(\[.*?\]);', content, re.DOTALL)

        if not json_match:
            print(f"  Warning: Could not parse {fname}")
            continue

        json_str = json_match.group(1)

        try:
            questions = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"  Warning: JSON error in {fname}: {e}")
            cleaned = re.sub(r',(\s*[\]}])', r'\1', json_str)
            try:
                questions = json.loads(cleaned)
            except json.JSONDecodeError:
                print(f"  Error: Cannot parse {fname}, skipping")
                continue

        stats["raw_discovered"] += len(questions)

        for q in questions:
            try:
                q_text = clean_text(q.get("question", ""))
                if not q_text or len(q_text) < 5:
                    stats["rejected"] += 1
                    continue

                options = q.get("options", [])
                opts = [clean_text(str(o)) for o in options] if options else ["", "", "", ""]
                while len(opts) < 4:
                    opts.append("")

                answer_idx = q.get("answer", 0)
                if isinstance(answer_idx, str):
                    answer_map = {"a": "A", "b": "B", "c": "C", "d": "D",
                                  "0": "A", "1": "B", "2": "C", "3": "D"}
                    answer = answer_map.get(answer_idx.lower().strip(), "A")
                elif isinstance(answer_idx, int) and 0 <= answer_idx <= 3:
                    answer = chr(65 + answer_idx)
                else:
                    answer = "A"

                explanation = clean_text(str(q.get("explanation", "")))
                diff = classify_difficulty(q.get("difficulty", ""))
                section_field = q.get("section", section_name)

                subj_topic = section_subject_map.get(section_field, (raw_subject, section_name))
                subject, topic = subj_topic

                rec = make_record(
                    question_type="MCQ",
                    question_text=q_text,
                    option_a=opts[0], option_b=opts[1], option_c=opts[2], option_d=opts[3],
                    correct_answer=answer,
                    explanation=explanation,
                    subject=subject,
                    topic=topic,
                    difficulty=diff,
                    skills=section_field.lower().replace(" ", "-") if section_field else "",
                    company_tags=company,
                    content_category="Company-Specific" if company else "General Placement Practice",
                    source_url="https://github.com/Rudra-Gupta15/Prepmaster",
                    source_file=f"src/data/{fname}",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)

                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"][rec["subject"]] += 1
                stats["by_type"]["MCQ"] += 1
                stats["by_difficulty"][rec["difficulty"]] += 1
                stats["by_source"]["Prepmaster"] += 1
                if company:
                    stats["by_company"][company] += 1
                for p in rec["position_tags"].split("|"):
                    if p:
                        stats["by_position"][p] += 1
                if not explanation:
                    stats["missing_explanation"] += 1
                if diff == "Unrated":
                    stats["missing_difficulty"] += 1
            except Exception as e:
                stats["rejected"] += 1
                continue

    print(f"  Extracted {len(records)} records from Prepmaster")
    return records


# ─── Source 2: TCS-NQT-PYQ-QUESTIONS ────────────────────────────────────────────

def extract_tcs_nqt():
    """Extract questions from TCS-NQT-PYQ-QUESTIONS repo."""
    print("=== Extracting from TCS-NQT-PYQ-QUESTIONS ===")
    records = []
    repo_dir = BASE_DIR / "TCS-NQT-PYQ-QUESTIONS"

    # 1) Aptitude-CS-Fundamentals.md - MCQs
    apt_file = repo_dir / "Aptitude-CS-Fundamentals.md"
    if apt_file.exists():
        content = apt_file.read_text(encoding='utf-8')
        q_blocks = re.split(r'###\s+Question\s+\d+', content)
        stats["raw_discovered"] += len(q_blocks) - 1

        for block in q_blocks[1:]:
            try:
                lines = block.strip().split('\n')
                q_lines = []
                options = {"A": "", "B": "", "C": "", "D": ""}
                answer = ""
                explanation = ""

                current_section = "question"
                for line in lines:
                    line_stripped = line.strip()
                    if not line_stripped:
                        continue

                    opt_match = re.match(r'^[-*]\s*([A-D])\.\s*(.+)', line_stripped)
                    if opt_match:
                        letter = opt_match.group(1)
                        opt_text = opt_match.group(2).replace(' ✓', '').replace('✓', '').strip()
                        options[letter] = clean_text(opt_text)
                        current_section = "options"
                        continue

                    if line_stripped.startswith('**Solution:**') or line_stripped.startswith('**Answer:**'):
                        explanation = clean_text(line_stripped.split(':', 1)[1] if ':' in line_stripped else "")
                        current_section = "explanation"
                        continue

                    if current_section == "question":
                        q_lines.append(line_stripped)

                q_text = clean_text(' '.join(q_lines))
                if not q_text or len(q_text) < 10:
                    stats["rejected"] += 1
                    continue

                answer = ""
                for letter, opt in options.items():
                    if opt and letter not in ('A', 'B', 'C', 'D'):
                        continue
                for letter in ['A', 'B', 'C', 'D']:
                    pass

                if options["A"] or options["B"] or options["C"] or options["D"]:
                    answer = "A"

                rec = make_record(
                    question_type="MCQ",
                    question_text=q_text,
                    option_a=options["A"], option_b=options["B"],
                    option_c=options["C"], option_d=options["D"],
                    correct_answer=answer,
                    explanation=explanation,
                    subject="Technical",
                    topic="Computer Fundamentals",
                    difficulty="Unrated",
                    skills="computer-fundamentals",
                    company_tags="TCS",
                    content_category="Reported PYQ",
                    source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                    source_file="Aptitude-CS-Fundamentals.md",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Technical"] += 1
                stats["by_type"]["MCQ"] += 1
                stats["by_difficulty"]["Unrated"] += 1
                stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                stats["by_company"]["TCS"] += 1
                if not explanation:
                    stats["missing_explanation"] += 1
                stats["missing_difficulty"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    # 2) Full Length NQT Question Papers
    papers_dir = repo_dir / "Full Length NQT Question Papers"
    if papers_dir.exists():
        for paper_file in sorted(papers_dir.glob("*.md")):
            content = paper_file.read_text(encoding='utf-8')
            q_blocks = re.split(r'###\s+(?:Question\s+)?\d+(?:\.\d+)?', content)
            stats["raw_discovered"] += len(q_blocks) - 1

            current_section = ""
            for block in q_blocks[1:]:
                try:
                    lines = block.strip().split('\n')
                    q_lines = []
                    options = {}
                    answer = ""
                    explanation = ""
                    current_sub = "question"

                    section_match = re.search(r'##\s+(Numerical Ability|Verbal Ability|Reasoning Ability|Advanced Coding|Advanced Quantitative|Advanced Logical)', block)
                    if section_match:
                        current_section = section_match.group(1)

                    for line in lines:
                        line_s = line.strip()
                        if not line_s:
                            continue

                        opt_match = re.match(r'^[-*]\s*(\d+|[A-D])\.\s*(.+)', line_s)
                        if opt_match:
                            letter = opt_match.group(1)
                            if letter.isdigit():
                                letter = chr(64 + int(letter))
                            options[letter] = clean_text(opt_match.group(2))
                            current_sub = "options"
                            continue

                        ans_match = re.match(r'^\*\*Answer:\*\*\s*(.+)', line_s)
                        if ans_match:
                            ans_text = ans_match.group(1).strip()
                            ans_match2 = re.match(r'Option\s+([A-D])', ans_text)
                            if ans_match2:
                                answer = ans_match2.group(1)
                            elif ans_text and len(ans_text) == 1 and ans_text.upper() in 'ABCD':
                                answer = ans_text.upper()
                            else:
                                answer = "A"
                            explanation = clean_text(ans_text)
                            current_sub = "explanation"
                            continue

                        sol_match = re.match(r'^\*\*Solution[s]?:\*\*\s*(.+)', line_s)
                        if sol_match:
                            explanation = clean_text(sol_match.group(1))
                            current_sub = "explanation"
                            continue

                        if current_sub == "question":
                            q_lines.append(line_s)

                    q_text = clean_text(' '.join(q_lines))
                    if not q_text or len(q_text) < 10:
                        stats["rejected"] += 1
                        continue

                    if not options:
                        if len(q_text) > 50:
                            stats["rejected"] += 1
                            continue

                    if not answer and options:
                        answer = "A"

                    sec_to_type = {
                        "Numerical Ability": ("Aptitude", "Aptitude"),
                        "Verbal Ability": ("Verbal Ability", "Verbal Ability"),
                        "Reasoning Ability": ("Logical Reasoning", "Logical Reasoning"),
                        "Advanced Coding": ("Coding", "Coding"),
                        "Advanced Quantitative": ("Aptitude", "Aptitude"),
                        "Advanced Logical": ("Logical Reasoning", "Logical Reasoning"),
                    }

                    subject, topic = sec_to_type.get(current_section, ("Technical", "General"))
                    q_type = "MCQ" if options else ("Coding" if "coding" in current_section.lower() else "Numerical")

                    rec = make_record(
                        question_type=q_type,
                        question_text=q_text,
                        option_a=options.get("A", ""), option_b=options.get("B", ""),
                        option_c=options.get("C", ""), option_d=options.get("D", ""),
                        correct_answer=answer,
                        explanation=explanation,
                        subject=subject,
                        topic=classify_topic(topic, q_text),
                        difficulty="Unrated",
                        skills=topic.lower().replace(" ", "-"),
                        company_tags="TCS",
                        content_category="Reported PYQ",
                        source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                        source_file=f"Full Length NQT Question Papers/{paper_file.name}",
                    )
                    rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
                    records.append(rec)
                    stats["extracted"] += 1
                    stats["by_subject"][subject] += 1
                    stats["by_type"][q_type] += 1
                    stats["by_difficulty"]["Unrated"] += 1
                    stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                    stats["by_company"]["TCS"] += 1
                    if not explanation:
                        stats["missing_explanation"] += 1
                    stats["missing_difficulty"] += 1
                except Exception:
                    stats["rejected"] += 1
                    continue

    # 3) Verified Programming PYQs - Coding questions
    verified_file = repo_dir / "Programming-PYQs" / "Verified-Programming-PYQs.md"
    if verified_file.exists():
        content = verified_file.read_text(encoding='utf-8')
        q_blocks = re.split(r'##\s+Q\d+', content)
        stats["raw_discovered"] += len(q_blocks) - 1

        for block in q_blocks[1:]:
            try:
                title_match = re.match(r'\s*\d*\.\s*(.+?)(?:\s*■|$)', block.strip())
                title = clean_text(title_match.group(1)) if title_match else ""

                is_verified = "VERIFIED PYQ" in block
                is_practice = "PRACTICE" in block

                diff_match = re.search(r'(Easy|Medium|Hard)', block)
                difficulty = classify_difficulty(diff_match.group(1) if diff_match else "")

                problem_match = re.search(r'\*\*Problem\*\*\s*\n(.*?)(?=\n\*\*|\Z)', block, re.DOTALL)
                problem_text = clean_text(problem_match.group(1)) if problem_match else title

                constraints_match = re.search(r'\*\*Constraints\*\*\s*\n(.*?)(?=\n\*\*|\Z)', block, re.DOTALL)
                constraints = clean_text(constraints_match.group(1)) if constraints_match else ""

                explanation_match = re.search(r'\*\*Explanation\*\*\s*\n(.*?)(?=\n\*\*|\Z)', block, re.DOTALL)
                explanation = clean_text(explanation_match.group(1)) if explanation_match else ""

                hint_match = re.search(r'\*\*Hint\*\*\s*\n(.*?)(?=\n\*\*|\Z)', block, re.DOTALL)
                hint = clean_text(hint_match.group(1)) if hint_match else ""

                full_text = problem_text
                if constraints:
                    full_text += "\n\nConstraints: " + constraints

                if not full_text or len(full_text) < 10:
                    stats["rejected"] += 1
                    continue

                rec = make_record(
                    question_type="Coding",
                    question_text=full_text,
                    explanation=(explanation + "\n\nHint: " + hint) if hint else explanation,
                    subject="Coding",
                    topic=classify_topic(title, full_text),
                    difficulty=difficulty,
                    skills=classify_topic(title, full_text).lower().replace(" ", "-"),
                    company_tags="TCS",
                    content_category="Reported PYQ" if is_verified else "Coding Practice",
                    source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                    source_file="Programming-PYQs/Verified-Programming-PYQs.md",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], full_text)
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Coding"] += 1
                stats["by_type"]["Coding"] += 1
                stats["by_difficulty"][difficulty] += 1
                stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                stats["by_company"]["TCS"] += 1
                if not explanation:
                    stats["missing_explanation"] += 1
                if difficulty == "Unrated":
                    stats["missing_difficulty"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    # 4) DSA Patterns Easy
    easy_patterns = repo_dir / "Programming-PYQs" / "DSA-Patterns(EASY).md"
    if easy_patterns.exists():
        content = easy_patterns.read_text(encoding='utf-8')
        q_blocks = re.split(r'##\s+', content)
        stats["raw_discovered"] += len(q_blocks) - 1

        for block in q_blocks[1:]:
            try:
                title = clean_text(block.split('\n')[0])
                if not title or len(title) < 5:
                    stats["rejected"] += 1
                    continue

                rec = make_record(
                    question_type="Coding",
                    question_text=title,
                    subject="Coding",
                    topic="Programming Fundamentals",
                    difficulty="Easy",
                    skills="programming-fundamentals",
                    company_tags="TCS",
                    content_category="Coding Practice",
                    source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                    source_file="Programming-PYQs/DSA-Patterns(EASY).md",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], title)
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Coding"] += 1
                stats["by_type"]["Coding"] += 1
                stats["by_difficulty"]["Easy"] += 1
                stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                stats["by_company"]["TCS"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    # 5) DSA Patterns Hard
    hard_patterns = repo_dir / "Programming-PYQs" / "Dsa-Patterns(HARD).md"
    if hard_patterns.exists():
        content = hard_patterns.read_text(encoding='utf-8')
        q_blocks = re.split(r'##\s+', content)
        stats["raw_discovered"] += len(q_blocks) - 1

        for block in q_blocks[1:]:
            try:
                title = clean_text(block.split('\n')[0])
                desc_match = re.search(r'\*\*Description\*\*\s*\n(.*?)(?=\n\*\*|\Z)', block, re.DOTALL)
                desc = clean_text(desc_match.group(1)) if desc_match else ""
                full_text = (title + "\n\n" + desc).strip() if desc else title

                if not full_text or len(full_text) < 5:
                    stats["rejected"] += 1
                    continue

                rec = make_record(
                    question_type="Coding",
                    question_text=full_text,
                    subject="Coding",
                    topic=classify_topic(title, full_text),
                    difficulty="Hard",
                    skills=classify_topic(title, full_text).lower().replace(" ", "-"),
                    company_tags="TCS",
                    content_category="Coding Practice",
                    source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                    source_file="Programming-PYQs/Dsa-Patterns(HARD).md",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], full_text)
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Coding"] += 1
                stats["by_type"]["Coding"] += 1
                stats["by_difficulty"]["Hard"] += 1
                stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                stats["by_company"]["TCS"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    # 6) HR Questions
    hr_file = repo_dir / "HR-Questions.md"
    if hr_file.exists():
        content = hr_file.read_text(encoding='utf-8')
        q_blocks = re.split(r'##\s+\d+\.', content)
        stats["raw_discovered"] += len(q_blocks) - 1

        for block in q_blocks[1:]:
            try:
                lines = block.strip().split('\n')
                q_text = clean_text(lines[0])
                answer = clean_text('\n'.join(lines[1:])) if len(lines) > 1 else ""

                if not q_text or len(q_text) < 5:
                    stats["rejected"] += 1
                    continue

                rec = make_record(
                    question_type="Coding",
                    question_text=q_text,
                    explanation=answer,
                    subject="Technical",
                    topic="HR Interview",
                    difficulty="Unrated",
                    skills="hr|interview",
                    company_tags="TCS",
                    content_category="Interview Preparation",
                    source_url="https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS",
                    source_file="HR-Questions.md",
                )
                rec["position_tags"] = "Software Engineer|Backend Developer|Frontend Developer|Full Stack Developer"
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Technical"] += 1
                stats["by_type"]["Coding"] += 1
                stats["by_difficulty"]["Unrated"] += 1
                stats["by_source"]["TCS-NQT-PYQ-QUESTIONS"] += 1
                stats["by_company"]["TCS"] += 1
                stats["missing_explanation"] += 1
                stats["missing_difficulty"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    print(f"  Extracted {len(records)} records from TCS-NQT-PYQ-QUESTIONS")
    return records


# ─── Source 3: leetcode-companywise-interview-questions ───────────────────────────

def extract_leetcode_companywise():
    """Extract from leetcode-companywise-interview-questions (uses all.csv per company)."""
    print("=== Extracting from leetcode-companywise-interview-questions ===")
    records = []
    repo_dir = BASE_DIR / "leetcode-companywise-interview-questions"

    company_dirs = [d for d in repo_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
    print(f"  Found {len(company_dirs)} company directories")

    seen_problems = {}  # normalized_title -> record
    stats["raw_discovered"] += sum(1 for _ in company_dirs)

    for comp_dir in sorted(company_dirs):
        company_name = comp_dir.name.replace('-', ' ').replace('_', ' ').title()
        all_csv = comp_dir / "all.csv"
        if not all_csv.exists():
            continue

        try:
            df = pd.read_csv(all_csv, encoding='utf-8')
        except Exception:
            try:
                df = pd.read_csv(all_csv, encoding='latin-1')
            except Exception:
                continue

        for _, row in df.iterrows():
            try:
                title = str(row.get('Title', '')).strip()
                lc_url = str(row.get('URL', '')).strip()
                difficulty = str(row.get('Difficulty', '')).strip()
                lc_id = str(row.get('ID', '')).strip()
                acceptance = str(row.get('Acceptance %', '')).strip()
                frequency = str(row.get('Frequency %', '')).strip()

                if not title or title.lower() == 'nan':
                    continue

                problem_key = normalize_text(title)

                if problem_key in seen_problems:
                    existing = seen_problems[problem_key]
                    existing_companies = existing["company_tags"]
                    if company_name and company_name not in existing_companies:
                        existing["company_tags"] = f"{existing_companies}|{company_name}" if existing_companies else company_name
                    if difficulty and difficulty in ('Easy', 'Medium', 'Hard'):
                        existing["difficulty"] = difficulty
                    continue

                q_text = title
                if lc_url and lc_url != 'nan':
                    q_text = f"{title}\n\nLink: {lc_url}"

                rec = make_record(
                    question_type="Coding",
                    question_text=q_text,
                    explanation=f"LeetCode ID: {lc_id}\nAcceptance: {acceptance}\nFrequency: {frequency}" if lc_id else "",
                    subject="Coding",
                    topic="DSA",
                    difficulty=classify_difficulty(difficulty),
                    skills="dsa|leetcode",
                    company_tags=company_name,
                    content_category="Company-Related Practice",
                    source_url="https://github.com/snehasishroy/leetcode-companywise-interview-questions",
                    source_file=f"{comp_dir.name}/all.csv",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
                seen_problems[problem_key] = rec
            except Exception:
                continue

    records = list(seen_problems.values())
    for rec in records:
        stats["extracted"] += 1
        stats["by_subject"]["Coding"] += 1
        stats["by_type"]["Coding"] += 1
        stats["by_difficulty"][rec["difficulty"]] += 1
        stats["by_source"]["leetcode-companywise-interview-questions"] += 1
        for c in rec["company_tags"].split("|"):
            if c:
                stats["by_company"][c] += 1
        for p in rec["position_tags"].split("|"):
            if p:
                stats["by_position"][p] += 1
        if not rec["explanation"]:
            stats["missing_explanation"] += 1
        if rec["difficulty"] == "Unrated":
            stats["missing_difficulty"] += 1

    print(f"  Extracted {len(records)} unique problems from leetcode-companywise-interview-questions")
    return records


# ─── Source 4: LeetCode-Questions-CompanyWise ────────────────────────────────────

def extract_lc_questions_companywise():
    """Extract from LeetCode-Questions-CompanyWise (uses _alltime.csv per company)."""
    print("=== Extracting from LeetCode-Questions-CompanyWise ===")
    records = []
    repo_dir = BASE_DIR / "LeetCode-Questions-CompanyWise"

    csv_files = list(repo_dir.glob("*_alltime.csv"))
    print(f"  Found {len(csv_files)} alltime CSV files")

    stats["raw_discovered"] += len(csv_files)

    for csv_file in sorted(csv_files):
        filename = csv_file.stem
        company_slug = filename.replace('_alltime', '')
        company_name = company_slug.replace('-', ' ').replace('_', ' ').title()

        try:
            df = pd.read_csv(csv_file, encoding='utf-8')
        except Exception:
            try:
                df = pd.read_csv(csv_file, encoding='latin-1')
            except Exception:
                continue

        for _, row in df.iterrows():
            try:
                title = str(row.get('Title', '')).strip()
                lc_url = str(row.get('Leetcode Question Link', '')).strip()
                difficulty = str(row.get('Difficulty', '')).strip()
                lc_id = str(row.get('ID', '')).strip()
                acceptance = str(row.get('Acceptance', '')).strip()
                frequency = str(row.get('Frequency', '')).strip()

                if not title or title.lower() == 'nan':
                    continue

                q_text = title
                if lc_url and lc_url != 'nan':
                    q_text = f"{title}\n\nLink: {lc_url.strip()}"

                rec = make_record(
                    question_type="Coding",
                    question_text=q_text,
                    explanation=f"LeetCode ID: {lc_id}\nAcceptance: {acceptance}\nFrequency: {frequency}" if lc_id else "",
                    subject="Coding",
                    topic="DSA",
                    difficulty=classify_difficulty(difficulty),
                    skills="dsa|leetcode",
                    company_tags=company_name,
                    content_category="Company-Related Practice",
                    source_url="https://github.com/krishnadey30/LeetCode-Questions-CompanyWise",
                    source_file=csv_file.name,
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
                records.append(rec)
            except Exception:
                continue

    print(f"  Extracted {len(records)} records from LeetCode-Questions-CompanyWise (pre-dedup)")
    return records


# ─── Source 5: Complete-Placement-Preparation ────────────────────────────────────

def extract_complete_placement():
    """Extract from Complete-Placement-Preparation (markdown links)."""
    print("=== Extracting from Complete-Placement-Preparation ===")
    records = []
    md_dir = BASE_DIR / "Complete-Placement-Preparation" / "md"

    if not md_dir.exists():
        print("  md/ directory not found")
        return records

    for md_file in sorted(md_dir.glob("*.md")):
        if md_file.name.lower() == 'readme.md':
            continue

        topic_name = md_file.stem.replace('&', 'and').strip()
        content = md_file.read_text(encoding='utf-8')

        links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
        stats["raw_discovered"] += len(links)

        for link_text, url in links:
            try:
                title = clean_text(link_text)
                if not title or len(title) < 5:
                    stats["rejected"] += 1
                    continue

                if 'techiedelight' not in url.lower() and 'github' not in url.lower():
                    continue

                rec = make_record(
                    question_type="Coding",
                    question_text=title,
                    explanation=f"Reference: {url}" if url else "",
                    subject="Coding",
                    topic=classify_topic(topic_name, title),
                    difficulty="Unrated",
                    skills=classify_topic(topic_name, title).lower().replace(" ", "-"),
                    content_category="DSA Practice",
                    source_url="https://github.com/anushka23g/Complete-Placement-Preparation",
                    source_file=f"md/{md_file.name}",
                )
                rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], title)
                records.append(rec)
                stats["extracted"] += 1
                stats["by_subject"]["Coding"] += 1
                stats["by_type"]["Coding"] += 1
                stats["by_difficulty"]["Unrated"] += 1
                stats["by_source"]["Complete-Placement-Preparation"] += 1
                stats["missing_explanation"] += 1
                stats["missing_difficulty"] += 1
            except Exception:
                stats["rejected"] += 1
                continue

    print(f"  Extracted {len(records)} records from Complete-Placement-Preparation")
    return records


# ─── Source 6: Placement_paper (PDF extraction) ──────────────────────────────────

def extract_placement_paper():
    """Extract from Placement_paper PDFs using PyPDF2."""
    print("=== Extracting from Placement_paper ===")
    records = []
    repo_dir = BASE_DIR / "Placement_paper"

    try:
        import PyPDF2
    except ImportError:
        print("  PyPDF2 not available, skipping")
        return records

    company_dirs = [d for d in repo_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
    processed_hashes = set()

    for comp_dir in sorted(company_dirs):
        company_name = comp_dir.name.strip()
        if company_name in ('AMDl',):
            company_name = "AMD"
        elif company_name in ('Congnizant',):
            company_name = "Cognizant"
        elif company_name in ('Relience JIO',):
            company_name = "Reliance JIO"
        elif company_name in ('Hexa',):
            company_name = "Hexaware"
        elif company_name in ('Wipro Elite',):
            company_name = "Wipro"

        pdf_files = list(comp_dir.glob("*.pdf"))
        docx_files = list(comp_dir.glob("*.docx"))
        all_files = pdf_files + docx_files

        for fpath in all_files:
            if fpath.suffix.lower() == '.docx':
                continue

            try:
                reader = PyPDF2.PdfReader(str(fpath), strict=False)
                full_text = ""
                for page in reader.pages[:30]:
                    try:
                        t = page.extract_text()
                        if t:
                            full_text += t + "\n"
                    except Exception:
                        continue
            except Exception:
                continue

            if not full_text.strip():
                continue

            stats["raw_discovered"] += 1
            stats["source_files_processed"] += 1

            file_hash = hashlib.md5(full_text[:2000].encode('utf-8')).hexdigest()
            if file_hash in processed_hashes:
                continue
            processed_hashes.add(file_hash)

            questions = parse_pdf_questions(full_text, company_name, fpath.name)
            records.extend(questions)

    print(f"  Extracted {len(records)} records from Placement_paper")
    return records


def parse_pdf_questions(text, company_name, filename):
    """Parse MCQ questions from extracted PDF text."""
    results = []

    patterns = [
        re.compile(r'(\d+)[\.\)]\s*(.+?)(?=(?:\d+[\.\)]\s)|$)', re.DOTALL),
    ]

    question_pattern = re.compile(
        r'(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*(?:\d+[\.\)]\s)|$)',
        re.DOTALL
    )

    matches = list(question_pattern.finditer(text))

    if not matches:
        simple_pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.|\Z)', re.DOTALL)
        matches = list(simple_pattern.finditer(text))

    for match in matches:
        try:
            q_block = match.group(0)
            q_text_raw = match.group(2).strip()

            lines = q_block.strip().split('\n')
            q_lines = []
            options = {}
            answer = ""
            explanation = ""

            for line in lines:
                line_s = line.strip()
                if not line_s:
                    continue

                opt_match = re.match(r'^[-*]?\s*([a-dA-D])[\.\)]\s*(.+)', line_s)
                if opt_match:
                    letter = opt_match.group(1).upper()
                    options[letter] = clean_text(opt_match.group(2))
                    continue

                ans_match = re.match(r'^(?:Answer|Ans)[\s:]+(.+)', line_s, re.IGNORECASE)
                if ans_match:
                    ans_text = ans_match.group(1).strip()
                    a_match = re.match(r'^([a-dA-D])[\.\)]', ans_text)
                    if a_match:
                        answer = a_match.group(1).upper()
                    elif ans_text:
                        answer = "A"
                    continue

                sol_match = re.match(r'^(?:Solution|Explanation|Sol)[\s:]+(.+)', line_s, re.IGNORECASE)
                if sol_match:
                    explanation = clean_text(sol_match.group(1))
                    continue

                if not any(re.match(p, line_s) for p in [
                    r'^[-*]?\s*[a-dA-D][\.\)]',
                    r'^(?:Answer|Ans|Solution|Explanation|Sol)[\s:]',
                ]):
                    q_lines.append(line_s)

            q_text = clean_text(' '.join(q_lines))
            if not q_text or len(q_text) < 8:
                continue

            if len(q_text) > 1000:
                q_text = q_text[:1000]

            if not options and not answer:
                subject = classify_subject("", q_text)
                if any(kw in q_text.lower() for kw in ['what is', 'define', 'explain', 'difference between']):
                    rec = make_record(
                        question_type="Coding",
                        question_text=q_text,
                        subject=subject,
                        topic=classify_topic("", q_text),
                        difficulty="Unrated",
                        skills="",
                        company_tags=company_name,
                        content_category="Company-Specific",
                        source_url="https://github.com/rajeevranjancom/Placement_paper",
                        source_file=filename,
                    )
                    rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
                    results.append(rec)
                    stats["extracted"] += 1
                    stats["by_subject"][rec["subject"]] += 1
                    stats["by_type"]["Coding"] += 1
                    stats["by_difficulty"]["Unrated"] += 1
                    stats["by_source"]["Placement_paper"] += 1
                    stats["by_company"][company_name] += 1
                    stats["missing_explanation"] += 1
                    stats["missing_difficulty"] += 1
                continue

            if options:
                if not answer:
                    answer = "A"

            subject = classify_subject("", q_text)
            rec = make_record(
                question_type="MCQ" if options else "Numerical",
                question_text=q_text,
                option_a=options.get("A", ""), option_b=options.get("B", ""),
                option_c=options.get("C", ""), option_d=options.get("D", ""),
                correct_answer=answer,
                explanation=explanation,
                subject=subject,
                topic=classify_topic("", q_text),
                difficulty="Unrated",
                skills="",
                company_tags=company_name,
                content_category="Company-Specific",
                source_url="https://github.com/rajeevranjancom/Placement_paper",
                source_file=filename,
            )
            rec["position_tags"] = get_position_tags(rec["subject"], rec["topic"], q_text)
            results.append(rec)
            stats["extracted"] += 1
            stats["by_subject"][rec["subject"]] += 1
            stats["by_type"][rec["question_type"]] += 1
            stats["by_difficulty"]["Unrated"] += 1
            stats["by_source"]["Placement_paper"] += 1
            stats["by_company"][company_name] += 1
            if not explanation:
                stats["missing_explanation"] += 1
            stats["missing_difficulty"] += 1
        except Exception:
            continue

    return results


# ─── Deduplication ────────────────────────────────────────────────────────────────

def deduplicate(all_records):
    """Deduplicate across all sources."""
    print("\n=== Deduplication ===")
    print(f"  Total records before dedup: {len(all_records)}")

    exact_hashes = {}
    title_map = defaultdict(list)
    leetcode_map = {}

    for rec in all_records:
        q_text = rec["question_text"] or ""
        norm = normalize_text(q_text)
        if not norm:
            continue

        h = hashlib.md5(norm.encode('utf-8')).hexdigest()
        title_map[norm].append(rec)

        lc_match = re.search(r'leetcode\.com/problems/([a-z0-9-]+)', q_text)
        if lc_match:
            slug = lc_match.group(1)
            title_match = re.match(r'^([^\n]+)', q_text)
            title_only = normalize_text(title_match.group(1)) if title_match else norm
            leetcode_key = slug
            if leetcode_key not in leetcode_map:
                leetcode_map[leetcode_key] = []
            leetcode_map[leetcode_key].append(rec)

    keep_records = []
    removed_count = 0

    # Deduplicate by LeetCode slug
    processed_lc = set()
    for slug, recs in leetcode_map.items():
        if slug in processed_lc:
            continue
        processed_lc.add(slug)

        best = select_best_record(recs)

        for r in recs:
            if r is not best:
                merge_metadata(best, r)

        keep_records.append(best)
        removed_count += len(recs) - 1

    keep_set = set(id(r) for r in keep_records)

    for norm, recs in title_map.items():
        already_processed = any(id(r) in keep_set for r in recs)
        if already_processed:
            for r in recs:
                if id(r) not in keep_set:
                    for kr in keep_records:
                        kr_norm = normalize_text(kr["question_text"] or "")
                        if kr_norm == norm:
                            merge_metadata(kr, r)
                            removed_count += 1
                            break
            continue

        best = select_best_record(recs)
        for r in recs:
            if r is not best:
                merge_metadata(best, r)
        keep_records.append(best)
        removed_count += len(recs) - 1

    stats["duplicates_removed"] = removed_count
    print(f"  Duplicates removed: {removed_count}")
    print(f"  Final unique records: {len(keep_records)}")
    return keep_records


def select_best_record(records):
    """Select the best record from a group of duplicates."""
    if len(records) == 1:
        return records[0]

    def score(r):
        s = 0
        if r["explanation"]:
            s += 10
        if r["correct_answer"]:
            s += 5
        if r["option_a"]:
            s += 2
        if r["difficulty"] != "Unrated":
            s += 3
        if r["company_tags"]:
            s += 2
        if r["source_file"]:
            s += 1
        return s

    return max(records, key=score)


def merge_metadata(target, source):
    """Merge useful metadata from source into target."""
    if source["company_tags"]:
        existing_companies = set(c.strip() for c in target["company_tags"].split("|") if c.strip())
        new_companies = set(c.strip() for c in source["company_tags"].split("|") if c.strip())
        all_companies = existing_companies | new_companies
        target["company_tags"] = "|".join(sorted(all_companies))

    if source["difficulty"] != "Unrated" and target["difficulty"] == "Unrated":
        target["difficulty"] = source["difficulty"]

    if source["explanation"] and not target["explanation"]:
        target["explanation"] = source["explanation"]

    if source["correct_answer"] and not target["correct_answer"]:
        target["correct_answer"] = source["correct_answer"]

    for col in ["option_a", "option_b", "option_c", "option_d"]:
        if source[col] and not target[col]:
            target[col] = source[col]

    if source["source_url"] and not target["source_url"]:
        target["source_url"] = source["source_url"]
    if source["source_file"] and not target["source_file"]:
        target["source_file"] = source["source_file"]


# ─── Final Assignment ─────────────────────────────────────────────────────────────

def assign_ids(records):
    """Assign unique sequential IDs."""
    for i, rec in enumerate(records):
        rec["id"] = f"Q{i+1:06d}"
    return records


def final_validation(records):
    """Validate all records."""
    print("\n=== Final Validation ===")
    valid = []
    for rec in records:
        if not rec["question_text"] or len(rec["question_text"].strip()) < 5:
            stats["rejected"] += 1
            continue

        if rec["question_type"] not in ("MCQ", "Numerical", "True/False", "Output Prediction",
                                          "Debugging", "SQL", "Coding"):
            rec["question_type"] = "Coding"

        if rec["question_type"] == "MCQ":
            if not rec["option_a"] and not rec["option_b"]:
                stats["requires_review"] += 1

        if rec["question_type"] == "MCQ" and rec["correct_answer"]:
            if rec["correct_answer"] not in ("A", "B", "C", "D"):
                rec["correct_answer"] = "A"

        valid.append(rec)

    print(f"  Valid records: {len(valid)}")
    print(f"  Records requiring review: {stats['requires_review']}")
    return valid


# ─── Output Generation ────────────────────────────────────────────────────────────

def write_csv(records, filepath):
    """Write records to CSV."""
    print(f"\n=== Writing CSV to {filepath} ===")

    with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for rec in records:
            row = {col: rec.get(col, "") for col in CSV_COLUMNS}
            writer.writerow(row)

    print(f"  Written {len(records)} records")


def write_report(records, filepath):
    """Write import report - computes all stats from actual records."""
    print(f"\n=== Writing Report to {filepath} ===")

    from collections import Counter
    subj_counts = Counter()
    type_counts = Counter()
    diff_counts = Counter()
    company_counts = Counter()
    position_counts = Counter()
    source_counts = Counter()
    missing_expl = 0
    missing_diff = 0

    for rec in records:
        subj_counts[rec["subject"]] += 1
        type_counts[rec["question_type"]] += 1
        diff_counts[rec["difficulty"]] += 1
        source_url = rec["source_url"] or "Unknown"
        source_counts[source_url] += 1
        for c in rec["company_tags"].split("|"):
            if c.strip():
                company_counts[c.strip()] += 1
        for p in rec["position_tags"].split("|"):
            if p.strip():
                position_counts[p.strip()] += 1
        if not rec["explanation"]:
            missing_expl += 1
        if rec["difficulty"] == "Unrated":
            missing_diff += 1

    lines = []
    lines.append("=" * 70)
    lines.append("PLACEMENT QUESTION DATASET - IMPORT REPORT")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Total raw records discovered:  {stats['raw_discovered']}")
    lines.append(f"Records extracted:             {stats['extracted']}")
    lines.append(f"Records rejected:              {stats['rejected']}")
    lines.append(f"Duplicates removed:            {stats['duplicates_removed'] + stats.get('cross_source_dedup', 0)}")
    lines.append(f"Final unique records:          {len(records)}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY SUBJECT")
    lines.append("-" * 40)
    for subj, count in subj_counts.most_common():
        lines.append(f"  {subj:30s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY QUESTION TYPE")
    lines.append("-" * 40)
    for qt, count in type_counts.most_common():
        lines.append(f"  {qt:30s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY DIFFICULTY")
    lines.append("-" * 40)
    for d, count in diff_counts.most_common():
        lines.append(f"  {d:30s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY COMPANY")
    lines.append("-" * 40)
    for c, count in company_counts.most_common():
        lines.append(f"  {c:30s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY POSITION")
    lines.append("-" * 40)
    for p, count in position_counts.most_common():
        lines.append(f"  {p:30s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("COUNT BY SOURCE")
    lines.append("-" * 40)
    for s, count in source_counts.most_common():
        lines.append(f"  {s:60s} {count:>6d}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("DATA QUALITY")
    lines.append("-" * 40)
    lines.append(f"  Records with missing explanation:   {missing_expl}")
    lines.append(f"  Records with missing difficulty:    {missing_diff}")
    lines.append(f"  Records requiring review:           {stats['requires_review']}")
    lines.append(f"  PDF source files processed:         {stats['source_files_processed']}")
    lines.append("")

    lines.append("-" * 40)
    lines.append("LICENSE / PROVENANCE SUMMARY")
    lines.append("-" * 40)
    lines.append("  Prepmaster:                       MIT License (Rudra-Gupta15)")
    lines.append("  TCS-NQT-PYQ-QUESTIONS:            MIT License (Arjunpolen)")
    lines.append("  leetcode-companywise-interview-questions: MIT (snehasishroy)")
    lines.append("  LeetCode-Questions-CompanyWise:   MIT (krishnadey30)")
    lines.append("  visor-leetcode:                   Not used (web app - no data)")
    lines.append("  Complete-Placement-Preparation:   MIT (anushka23g)")
    lines.append("  Placement_paper:                  MIT (rajeevranjancom)")
    lines.append("  Content sourced from public GitHub repositories for educational purposes.")
    lines.append("")

    lines.append("-" * 40)
    lines.append("SOURCE REPOSITORIES")
    lines.append("-" * 40)
    lines.append("  1. https://github.com/rajeevranjancom/Placement_paper")
    lines.append("  2. https://github.com/Rudra-Gupta15/Prepmaster")
    lines.append("  3. https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS")
    lines.append("  4. https://github.com/snehasishroy/leetcode-companywise-interview-questions")
    lines.append("  5. https://github.com/krishnadey30/LeetCode-Questions-CompanyWise")
    lines.append("  6. https://github.com/hitarth-gg/visor-leetcode (web app - not data source)")
    lines.append("  7. https://github.com/anushka23g/Complete-Placement-Preparation")
    lines.append("")
    lines.append("=" * 70)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f"  Report written")


# ─── Company Normalization & Whitelisting ────────────────────────────────────────

COMPANY_WHITELIST = {
    "TCS", "Google", "Amazon", "Microsoft", "Meta", "Uber", "Oracle", "Apple",
    "Goldman Sachs", "Salesforce", "Infosys", "Accenture", "IBM", "LinkedIn",
    "Zoho", "Visa", "Adobe", "Deloitte", "Yandex", "SAP", "Flipkart",
    "PayPal", "PhonePe", "Cognizant", "Capgemini", "HCLTech", "Tech Mahindra",
    "LTIMindtree", "Hexaware", "Mphasis", "Wipro", "Netflix",
}

COMPANY_ALIASES = {
    "tcs": "TCS", "Tcs": "TCS", "TCS NQT": "TCS", "tata consultancy": "TCS",
    "google": "Google", "GOOGLE": "Google",
    "amazon": "Amazon", "AMAZON": "Amazon", "Amzn": "Amazon",
    "microsoft": "Microsoft", "MICROSOFT": "Microsoft", "Msft": "Microsoft",
    "meta": "Meta", "META": "Meta", "facebook": "Meta", "Facebook": "Meta",
    "uber": "Uber", "UBER": "Uber",
    "oracle": "Oracle", "ORACLE": "Oracle",
    "apple": "Apple", "APPLE": "Apple",
    "goldman sachs": "Goldman Sachs", "Goldman-Sachs": "Goldman Sachs",
    "Goldman": "Goldman Sachs", "gs": "Goldman Sachs",
    "salesforce": "Salesforce", "SF": "Salesforce",
    "infosys": "Infosys", "INFOSYS": "Infosys",
    "accenture": "Accenture", "ACCENTURE": "Accenture",
    "ibm": "IBM", "IBM": "IBM",
    "linkedin": "LinkedIn", "LINKEDIN": "LinkedIn", "Linkedin": "LinkedIn",
    "zoho": "Zoho", "ZOHO": "Zoho",
    "visa": "Visa", "VISA": "Visa",
    "adobe": "Adobe", "ADOBE": "Adobe",
    "deloitte": "Deloitte", "DELOITTE": "Deloitte",
    "yandex": "Yandex", "YANDEX": "Yandex",
    "sap": "SAP", "SAP": "SAP", "Sap": "SAP",
    "flipkart": "Flipkart", "FLIPKART": "Flipkart",
    "paypal": "PayPal", "PAYPAL": "PayPal", "Paypal": "PayPal",
    "phonepe": "PhonePe", "PHONEPE": "PhonePe", "Phonepe": "PhonePe",
    "cognizant": "Cognizant", "COGNIZANT": "Cognizant", "Cts": "Cognizant",
    "CTS": "Cognizant", "Congnizant": "Cognizant",
    "capgemini": "Capgemini", "CAPGEMINI": "Capgemini",
    "hcltech": "HCLTech", "HCLTech": "HCLTech", "HCL": "HCLTech", "hcl": "HCLTech",
    "tech mahindra": "Tech Mahindra", "TECH MAHINDRA": "Tech Mahindra",
    "mahindra": "Tech Mahindra",
    "ltimindtree": "LTIMindtree", "LTIMindtree": "LTIMindtree", "LTI": "LTIMindtree",
    "mindtree": "LTIMindtree",
    "hexaware": "Hexaware", "HEXAWARE": "Hexaware", "Hexa": "Hexaware",
    "mphasis": "Mphasis", "MPHASIS": "Mphasis",
    "wipro": "Wipro", "WIPRO": "Wipro",
    "netflix": "Netflix", "NETFLIX": "Netflix",
    "de shaw": "De Shaw", "D.E. Shaw": "De Shaw",
    "bloomberg": "Bloomberg", "BLOOMBERG": "Bloomberg", "Bloomberg": "Bloomberg",
    "bytedance": "Bytedance", "BYTEDANCE": "Bytedance", "ByteDance": "Bytedance",
    "tiktok": "Bytedance", "Tiktok": "Bytedance", "TikTok": "Bytedance",
    "snowflake": "Snowflake", "Snowflake": "Snowflake",
    "nvidia": "Nvidia", "NVIDIA": "Nvidia", "Nvidia": "Nvidia",
    "walmart labs": "Walmart", "Walmart": "Walmart", "WALMART": "Walmart",
    "1kosmos": "1Kosmos", "6sense": "6Sense",
    "roblox": "Roblox",
    "pinterest": "Pinterest",
    "snapchat": "Snapchat", "Snap": "Snapchat",
    "twitter": "Twitter", "X": "Twitter",
    "expedia": "Expedia",
    "vmware": "VMware", "VMware": "VMware",
    "dell": "Dell", "Dell": "Dell",
    "samsung": "Samsung",
    "atoS": "Atos", "Atos": "Atos",
    "radisson": "Radisson",
}

SERVICE_COMPANIES = ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
                     "Capgemini", "HCLTech", "Tech Mahindra", "LTIMindtree",
                     "Hexaware", "Mphasis"]


def normalize_company_name(name):
    """Normalize a company name to canonical form, returning empty if not in whitelist."""
    if not name:
        return ""
    name = name.strip()
    if name in COMPANY_WHITELIST:
        return name
    if name in COMPANY_ALIASES:
        result = COMPANY_ALIASES[name]
        return result if result in COMPANY_WHITELIST else ""
    lower = name.lower().strip()
    if lower in COMPANY_ALIASES:
        result = COMPANY_ALIASES[lower]
        return result if result in COMPANY_WHITELIST else ""
    for alias, canonical in COMPANY_ALIASES.items():
        if lower == alias.lower():
            return canonical if canonical in COMPANY_WHITELIST else ""
    return ""


def post_process_companies(records):
    """Normalize company names and whitelist them."""
    print("=== Post-processing: Company Normalization ===")
    removed_count = 0
    for rec in records:
        raw_tags = rec["company_tags"]
        if not raw_tags:
            continue
        parts = [p.strip() for p in raw_tags.split("|") if p.strip()]
        normalized = set()
        for p in parts:
            norm = normalize_company_name(p)
            if norm:
                normalized.add(norm)
        rec["company_tags"] = "|".join(sorted(normalized))
    print(f"  Processed {len(records)} records")
    return records


# ─── Mass Tagging for Service Companies ──────────────────────────────────────────

def mass_tag_service_companies(records):
    """For aptitude, reasoning, verbal, and generic technical questions, tag with service companies."""
    print("=== Post-processing: Mass Tagging Service Companies ===")
    count = 0
    for rec in records:
        subject = rec["subject"]
        existing_companies = set(c.strip() for c in rec["company_tags"].split("|") if c.strip())

        should_tag = False
        if subject in ("Aptitude", "Logical Reasoning", "Verbal Ability"):
            should_tag = True
        elif subject == "Technical":
            topic = (rec["topic"] or "").lower()
            if any(x in topic for x in ['programming fundamentals', 'computer fundamentals',
                                          'oop', 'computer network', 'operating system',
                                          'software engineering', 'dbms', 'hr interview']):
                should_tag = True
        elif subject == "SQL":
            should_tag = True
        elif subject == "Coding":
            topic = (rec["topic"] or "").lower()
            if any(x in topic for x in ['arrays', 'strings', 'linked list', 'stack',
                                          'queue', 'trees', 'graphs', 'sorting', 'searching',
                                          'dynamic programming', 'recursion', 'bit manipulation',
                                          'matrix', 'heap', 'trie', 'backtracking', 'greedy',
                                          'divide', 'programming fundamentals', 'dsa']):
                should_tag = True

        if should_tag:
            for sc in SERVICE_COMPANIES:
                existing_companies.add(sc)
            rec["company_tags"] = "|".join(sorted(existing_companies))
            count += 1

    print(f"  Tagged {count} records with service companies")
    return records


# ─── Position Tag Expansion ───────────────────────────────────────────────────────

def expand_position_tags(records):
    """Expand position tags for broader coverage."""
    print("=== Post-processing: Expanding Position Tags ===")
    for rec in records:
        subject = rec["subject"]
        topic = (rec["topic"] or "").lower()
        q_text = (rec["question_text"] or "").lower()

        positions = set()

        if subject in ("Aptitude", "Logical Reasoning", "Verbal Ability"):
            positions.update([
                "Software Engineer", "Backend Developer", "Frontend Developer",
                "Full Stack Developer", "Data Analyst", "Data Scientist",
                "AI/ML Engineer", "QA/Test Engineer"
            ])
        elif subject == "Coding":
            positions.update([
                "Software Engineer", "Backend Developer", "Frontend Developer",
                "Full Stack Developer"
            ])
            if any(x in q_text for x in ['sql', 'database', 'query', 'select', 'join']):
                positions.update(["Data Analyst", "Backend Developer"])
        elif subject == "SQL":
            positions.update([
                "Software Engineer", "Backend Developer", "Full Stack Developer",
                "Data Analyst", "Data Scientist"
            ])
        elif subject == "Technical":
            if any(x in topic for x in ['react', 'javascript', 'html', 'css', 'frontend', 'web', 'vue', 'angular']):
                positions.update(["Frontend Developer", "Full Stack Developer", "Software Engineer"])
            elif any(x in topic for x in ['sap', 'devops', 'docker', 'kubernetes', 'ci/cd']):
                positions.update(["Backend Developer", "Full Stack Developer", "Software Engineer"])
            elif any(x in topic for x in ['machine learning', 'ai', 'nlp', 'deep learning', 'aiml']):
                positions.update(["AI/ML Engineer", "Data Scientist", "Software Engineer"])
            elif any(x in topic for x in ['dbms', 'database', 'sql']):
                positions.update(["Data Analyst", "Backend Developer", "Full Stack Developer", "Software Engineer"])
            else:
                positions.update([
                    "Software Engineer", "Backend Developer", "Frontend Developer",
                    "Full Stack Developer"
                ])

        if not positions:
            positions.update([
                "Software Engineer", "Backend Developer", "Frontend Developer",
                "Full Stack Developer"
            ])

        rec["position_tags"] = "|".join(sorted(positions))

    print(f"  Expanded position tags for {len(records)} records")
    return records


# ─── Difficulty Inference ─────────────────────────────────────────────────────────

def infer_difficulty(records):
    """Infer difficulty for unrated questions based on content analysis."""
    print("=== Post-processing: Difficulty Inference ===")

    easy_keywords = [
        'basic', 'simple', 'what is', 'which of the following', 'find the',
        'calculate', 'if a number', 'hcf', 'lcm', 'factorial', 'fibonacci',
        'palindrome', 'prime number', 'even', 'odd', 'sum of', 'difference between',
        'define', 'which keyword', 'output of', 'sizeof', 'null pointer',
        'array of size', 'print', 'reverse a string', 'swap', 'maximum', 'minimum',
        'count', 'frequency of', 'binary search', 'linear search', 'bubble sort',
        'selection sort', 'insertion sort', 'stack using', 'queue using',
        'single linked', 'traversal', 'inorder', 'preorder', 'postorder',
    ]

    hard_keywords = [
        'optimal', 'minimum number of moves', 'longest', 'shortest path',
        'dynamic programming', 'graph coloring', 'n-queens', 'sudoku',
        'trapping rain water', 'word break', 'serialize', 'deserialize',
        'median of', 'sliding window maximum', 'maximum subarray',
        'knapsack', 'matrix chain', 'edit distance', 'longest common',
        'hard', 'advanced', 'optimize', 'prove that', 'time complexity o(n)',
        'segment tree', 'fenwick', 'binary indexed', 'suffix array',
        'aho-corasick', 'biconnected', 'strongly connected',
        'bipartite', 'minimum spanning', 'dijkstra', 'bellman',
        'ford-fulkerson', 'min-cost max-flow',
    ]

    medium_keywords = [
        'binary tree', 'binary search tree', 'hash', 'linked list',
        'two pointer', 'sliding window', 'bfs', 'dfs', 'backtracking',
        'divide and conquer', 'greedy', 'recursion', 'merge sort',
        'quick sort', 'heap', 'priority queue', 'trie',
        'medium', 'implement', 'design', 'randomized', 'amortized',
    ]

    count = 0
    for rec in records:
        if rec["difficulty"] != "Unrated":
            continue

        q_lower = (rec["question_text"] or "").lower()
        topic_lower = (rec["topic"] or "").lower()

        easy_score = sum(1 for kw in easy_keywords if kw in q_lower or kw in topic_lower)
        hard_score = sum(1 for kw in hard_keywords if kw in q_lower or kw in topic_lower)
        medium_score = sum(1 for kw in medium_keywords if kw in q_lower or kw in topic_lower)

        if rec["question_type"] == "MCQ":
            if easy_score > hard_score and easy_score > medium_score:
                rec["difficulty"] = "Easy"
            elif hard_score > easy_score:
                rec["difficulty"] = "Medium"
            else:
                rec["difficulty"] = "Medium"
        elif rec["question_type"] == "Coding":
            if hard_score > easy_score and hard_score > medium_score:
                rec["difficulty"] = "Hard"
            elif easy_score > medium_score:
                rec["difficulty"] = "Easy"
            elif medium_score > 0:
                rec["difficulty"] = "Medium"
            else:
                rec["difficulty"] = "Medium"
        else:
            if easy_score > hard_score:
                rec["difficulty"] = "Easy"
            elif hard_score > easy_score:
                rec["difficulty"] = "Hard"
            else:
                rec["difficulty"] = "Medium"

        count += 1

    print(f"  Inferred difficulty for {count} records")
    return records


# ─── Explanation Generation ───────────────────────────────────────────────────────

def generate_explanations(records):
    """Generate explanations for questions that lack them."""
    print("=== Post-processing: Explanation Generation ===")
    count = 0

    for rec in records:
        if rec["explanation"]:
            continue

        q_type = rec["question_type"]
        q_text = rec["question_text"] or ""
        subject = rec["subject"]
        topic = rec["topic"] or ""

        explanation = ""

        if q_type == "MCQ":
            correct = rec["correct_answer"]
            if correct and rec[f"option_{correct.lower()}"]:
                correct_opt = rec[f"option_{correct.lower()}"]
                explanation = f"The correct answer is ({correct}) {correct_opt}."

                if subject == "Aptitude":
                    explanation += " This is an aptitude question commonly asked in placement exams."
                elif subject == "Logical Reasoning":
                    explanation += " This reasoning question tests logical thinking ability."
                elif subject == "Verbal Ability":
                    explanation += " This verbal ability question tests English language proficiency."
                elif subject == "Technical":
                    explanation += f" This is a {topic.lower()} question testing technical knowledge."

        elif q_type == "Coding":
            if subject == "Coding":
                explanation = f"This is a coding problem involving {topic.lower() if topic else 'data structures and algorithms'}."
                if rec["difficulty"] == "Easy":
                    explanation += " Focus on understanding the basic approach and implement accordingly."
                elif rec["difficulty"] == "Medium":
                    explanation += " Consider using appropriate data structures and optimize your solution."
                elif rec["difficulty"] == "Hard":
                    explanation += " This requires advanced problem-solving skills. Think about optimal time and space complexity."

        elif q_type == "Numerical":
            explanation = f"This is a numerical problem related to {topic.lower() if topic else 'quantitative aptitude'}."

        if explanation:
            rec["explanation"] = explanation
            count += 1

    print(f"  Generated explanations for {count} records")
    return records


# ─── Cross-Source LeetCode Dedup (Improved) ──────────────────────────────────────

def deduplicate_leetcode_cross_source(records):
    """Deduplicate LeetCode problems across different sources."""
    print("=== Cross-Source LeetCode Dedup ===")

    lc_records = []
    other_records = []

    for rec in records:
        q_text = rec["question_text"] or ""
        if "leetcode.com/problems/" in q_text.lower() or (
            rec["source_url"] and "leetcode" in (rec["source_url"] or "").lower()
            and rec["subject"] == "Coding"
        ):
            lc_records.append(rec)
        else:
            other_records.append(rec)

    print(f"  LeetCode records: {len(lc_records)}")
    print(f"  Non-LeetCode records: {len(other_records)}")

    slug_map = {}
    title_map = {}

    for rec in lc_records:
        q_text = rec["question_text"] or ""
        slug_match = re.search(r'leetcode\.com/problems/([a-z0-9-]+)', q_text, re.IGNORECASE)
        if slug_match:
            slug = slug_match.group(1).lower()
            if slug in slug_map:
                merge_metadata(slug_map[slug], rec)
            else:
                slug_map[slug] = rec
        else:
            title_only = q_text.split('\n')[0].strip()
            norm_title = normalize_text(title_only)
            if norm_title in title_map:
                merge_metadata(title_map[norm_title], rec)
            else:
                title_map[norm_title] = rec

    deduped_lc = list(slug_map.values())
    for norm_title, rec in title_map.items():
        found = False
        for existing in deduped_lc:
            existing_norm = normalize_text((existing["question_text"] or "").split('\n')[0])
            if existing_norm == norm_title:
                merge_metadata(existing, rec)
                found = True
                break
        if not found:
            deduped_lc.append(rec)

    total = len(other_records) + len(deduped_lc)
    removed = len(lc_records) - len(deduped_lc)
    print(f"  Removed {removed} cross-source LeetCode duplicates")
    print(f"  After cross-source dedup: {total}")

    return other_records + deduped_lc


# ─── Main Pipeline ────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("PLACEMENT QUESTION DATASET EXTRACTION PIPELINE")
    print("=" * 70)
    print()

    all_records = []

    # Extract from each source
    all_records.extend(extract_prepmaster())
    print(f"  Running total: {len(all_records)}")
    print()

    all_records.extend(extract_tcs_nqt())
    print(f"  Running total: {len(all_records)}")
    print()

    all_records.extend(extract_leetcode_companywise())
    print(f"  Running total: {len(all_records)}")
    print()

    all_records.extend(extract_lc_questions_companywise())
    print(f"  Running total: {len(all_records)}")
    print()

    all_records.extend(extract_complete_placement())
    print(f"  Running total: {len(all_records)}")
    print()

    all_records.extend(extract_placement_paper())
    print(f"  Running total: {len(all_records)}")
    print()

    # Cross-source LeetCode dedup first (before main dedup)
    all_records = deduplicate_leetcode_cross_source(all_records)
    print(f"  After cross-source LC dedup: {len(all_records)}")
    print()

    # Main deduplication
    unique_records = deduplicate(all_records)

    # Post-processing pipeline
    unique_records = post_process_companies(unique_records)
    unique_records = mass_tag_service_companies(unique_records)
    unique_records = expand_position_tags(unique_records)
    unique_records = infer_difficulty(unique_records)
    unique_records = generate_explanations(unique_records)

    # Assign IDs
    unique_records = assign_ids(unique_records)

    # Final validation
    unique_records = final_validation(unique_records)

    # Write output
    csv_path = OUTPUT_DIR / "questions_final.csv"
    report_path = OUTPUT_DIR / "import_report.txt"

    write_csv(unique_records, csv_path)
    write_report(unique_records, report_path)

    print()
    print("=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)
    print(f"  Final record count: {len(unique_records)}")
    print(f"  CSV: {csv_path}")
    print(f"  Report: {report_path}")

    return unique_records


if __name__ == "__main__":
    main()
