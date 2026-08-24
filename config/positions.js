module.exports.positions = [
  {
    name: 'Software Engineer',
    slug: 'software-engineer',
    icon: 'laptop',
    color: '#4f46e5',
    description: 'Full-stack development, system design, and problem-solving for SWE roles.',
    phases: [
      {
        name: 'Foundation',
        description: 'Build core problem-solving skills and quantitative fundamentals.',
        modules: [
          { name: 'Aptitude Basics', subjects: ['Aptitude'], topics: ['percentages', 'ratio-and-proportion', 'number-system', 'profit-and-loss', 'averages'] },
          { name: 'Reasoning Basics', subjects: ['Logical Reasoning'], topics: ['series', 'coding-decoding', 'analogy'] },
        ],
      },
      {
        name: 'Core DSA',
        description: 'Master data structures and algorithms for coding interviews.',
        modules: [
          { name: 'Arrays & Strings', subjects: ['Coding'], topics: ['arrays', 'string'] },
          { name: 'Linked Lists & Stacks', subjects: ['Coding'], topics: ['linked-lists', 'stack', 'queue'] },
          { name: 'Trees & Graphs', subjects: ['Coding'], topics: ['trees', 'graphs'] },
          { name: 'DP & Recursion', subjects: ['Coding'], topics: ['dynamic-programming', 'recursion'] },
        ],
      },
      {
        name: 'Technical',
        description: 'Core CS fundamentals asked in technical rounds.',
        modules: [
          { name: 'CS Fundamentals', subjects: ['Technical'], topics: ['oop', 'computer-networks', 'operating-systems', 'dbms'] },
          { name: 'SQL', subjects: ['SQL'], topics: ['select-basics', 'joins', 'group-by-aggregation', 'subqueries'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude speed practice and verbal rounds.',
        modules: [
          { name: 'Advanced Aptitude', subjects: ['Aptitude'], topics: ['time-speed-distance', 'time-and-work', 'probability', 'simple-compound-interest'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['grammar', 'vocabulary', 'reading-comprehension'] },
        ],
      },
    ],
  },
  {
    name: 'Backend Developer',
    slug: 'backend-developer',
    icon: 'server',
    color: '#059669',
    description: 'Server-side development, APIs, databases, and system architecture.',
    phases: [
      {
        name: 'Foundation',
        description: 'Database and SQL mastery — the backbone of backend work.',
        modules: [
          { name: 'SQL Mastery', subjects: ['SQL'], topics: ['select-basics', 'where-filters', 'joins', 'group-by-aggregation', 'having', 'subqueries', 'window-functions'] },
          { name: 'DBMS Concepts', subjects: ['Technical'], topics: ['dbms'] },
        ],
      },
      {
        name: 'Core DSA',
        description: 'Problem-solving for backend coding rounds.',
        modules: [
          { name: 'Arrays & Strings', subjects: ['Coding'], topics: ['arrays', 'string'] },
          { name: 'Trees & Graphs', subjects: ['Coding'], topics: ['trees', 'graphs', 'linked-lists', 'stack'] },
          { name: 'Sorting & Searching', subjects: ['Coding'], topics: ['sorting', 'searching'] },
        ],
      },
      {
        name: 'Systems',
        description: 'Networking, OS, and system design fundamentals.',
        modules: [
          { name: 'Computer Networks', subjects: ['Technical'], topics: ['computer-networks'] },
          { name: 'Operating Systems', subjects: ['Technical'], topics: ['operating-systems'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude and verbal for placement rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'time-and-work', 'time-speed-distance', 'ratio-and-proportion'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['grammar', 'vocabulary'] },
        ],
      },
    ],
  },
  {
    name: 'Frontend Developer',
    slug: 'frontend-developer',
    icon: 'monitor',
    color: '#e11d48',
    description: 'Client-side development, UI/UX, responsive design, and browser APIs.',
    phases: [
      {
        name: 'Foundation',
        description: 'Programming basics and web fundamentals.',
        modules: [
          { name: 'DSA Basics', subjects: ['Coding'], topics: ['arrays', 'string'] },
          { name: 'Web Fundamentals', subjects: ['Technical'], topics: ['computer-fundamentals', 'software-engineering'] },
        ],
      },
      {
        name: 'Frontend Core',
        description: 'React and modern frontend technologies.',
        modules: [
          { name: 'React', subjects: ['Technical'], topics: ['react'] },
          { name: 'OOP & JS Concepts', subjects: ['Technical'], topics: ['oop', 'programming-fundamentals'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude, verbal, and reasoning for placement rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'data-interpretation', 'averages', 'number-system'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['grammar', 'vocabulary', 'sentence-correction'] },
          { name: 'Reasoning', subjects: ['Logical Reasoning'], topics: ['series', 'analogy', 'odd-one-out'] },
        ],
      },
    ],
  },
  {
    name: 'Full Stack Developer',
    slug: 'full-stack-developer',
    icon: 'layers',
    color: '#0284c7',
    description: 'End-to-end development across frontend, backend, and databases.',
    phases: [
      {
        name: 'Foundation',
        description: 'SQL, databases, and core CS.',
        modules: [
          { name: 'SQL & DBMS', subjects: ['SQL', 'Technical'], topics: ['select-basics', 'joins', 'group-by-aggregation', 'dbms'] },
          { name: 'CS Fundamentals', subjects: ['Technical'], topics: ['computer-networks', 'oop', 'operating-systems'] },
        ],
      },
      {
        name: 'Core DSA',
        description: 'Full-stack coding interview prep.',
        modules: [
          { name: 'Arrays & Strings', subjects: ['Coding'], topics: ['arrays', 'string'] },
          { name: 'Trees & DP', subjects: ['Coding'], topics: ['trees', 'dynamic-programming', 'linked-lists', 'stack'] },
        ],
      },
      {
        name: 'Specialization',
        description: 'React for frontend, advanced SQL for backend.',
        modules: [
          { name: 'React', subjects: ['Technical'], topics: ['react'] },
          { name: 'Advanced SQL', subjects: ['SQL'], topics: ['window-functions', 'subqueries', 'having'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude and verbal rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'profit-and-loss', 'time-speed-distance', 'probability'] },
          { name: 'Reasoning', subjects: ['Logical Reasoning'], topics: ['coding-decoding', 'series', 'puzzles', 'seating-arrangement'] },
        ],
      },
    ],
  },
  {
    name: 'Data Analyst',
    slug: 'data-analyst',
    icon: 'bar-chart-2',
    color: '#d97706',
    description: 'Data analysis, SQL queries, statistics, and business intelligence.',
    phases: [
      {
        name: 'SQL Mastery',
        description: 'Complete SQL — the most critical skill for data analysts.',
        modules: [
          { name: 'Full SQL', subjects: ['SQL'], topics: ['select-basics', 'where-filters', 'joins', 'group-by-aggregation', 'having', 'subqueries', 'window-functions'] },
        ],
      },
      {
        name: 'Quantitative',
        description: 'Math and statistics for data work.',
        modules: [
          { name: 'Data Interpretation', subjects: ['Aptitude'], topics: ['data-interpretation', 'averages', 'percentages'] },
          { name: 'Statistics', subjects: ['Aptitude'], topics: ['ratio-and-proportion', 'probability', 'number-system'] },
        ],
      },
      {
        name: 'Analytical Reasoning',
        description: 'Logical and verbal for analyst placement rounds.',
        modules: [
          { name: 'Logical Reasoning', subjects: ['Logical Reasoning'], topics: ['series', 'puzzles', 'statement-conclusion', 'odd-one-out'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['reading-comprehension', 'grammar', 'fill-in-the-blanks'] },
        ],
      },
    ],
  },
  {
    name: 'Data Scientist',
    slug: 'data-scientist',
    icon: 'brain',
    color: '#7c3aed',
    description: 'Machine learning, statistics, Python, and analytical problem-solving.',
    phases: [
      {
        name: 'Foundation',
        description: 'SQL, programming basics, and math fundamentals.',
        modules: [
          { name: 'SQL & Data', subjects: ['SQL'], topics: ['select-basics', 'joins', 'window-functions', 'group-by-aggregation'] },
          { name: 'Programming Basics', subjects: ['Coding'], topics: ['arrays', 'string', 'recursion'] },
          { name: 'Math & Stats', subjects: ['Aptitude'], topics: ['probability', 'permutation-combination', 'data-interpretation'] },
        ],
      },
      {
        name: 'Core Skills',
        description: 'Technical foundations and AI/ML knowledge.',
        modules: [
          { name: 'Technical', subjects: ['Technical'], topics: ['oop', 'ai-ml'] },
          { name: 'DSA', subjects: ['Coding'], topics: ['dynamic-programming', 'sorting', 'searching'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude and reasoning for placement rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'ratio-and-proportion', 'number-system'] },
          { name: 'Reasoning', subjects: ['Logical Reasoning'], topics: ['series', 'puzzles', 'coding-decoding'] },
        ],
      },
    ],
  },
  {
    name: 'AI/ML Engineer',
    slug: 'ai-ml-engineer',
    icon: 'cpu',
    color: '#0ea5e9',
    description: 'Machine learning systems, algorithms, data pipelines, and model deployment.',
    phases: [
      {
        name: 'Foundation',
        description: 'Programming, math, and data skills.',
        modules: [
          { name: 'Programming & DSA', subjects: ['Coding'], topics: ['arrays', 'string', 'dynamic-programming', 'recursion'] },
          { name: 'SQL', subjects: ['SQL'], topics: ['select-basics', 'joins', 'subqueries', 'window-functions'] },
          { name: 'Math', subjects: ['Aptitude'], topics: ['probability', 'permutation-combination', 'data-interpretation'] },
        ],
      },
      {
        name: 'AI/ML Core',
        description: 'AI/ML technical fundamentals.',
        modules: [
          { name: 'AI & ML', subjects: ['Technical'], topics: ['ai-ml', 'data-structures', 'oop', 'computer-fundamentals'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude and verbal for placement rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'ratio-and-proportion', 'number-system'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['grammar', 'vocabulary'] },
        ],
      },
    ],
  },
  {
    name: 'QA/Test Engineer',
    slug: 'qa-test-engineer',
    icon: 'shield-check',
    color: '#10b981',
    description: 'Quality assurance, test automation, bug tracking, and software quality.',
    phases: [
      {
        name: 'Foundation',
        description: 'Testing fundamentals and programming basics.',
        modules: [
          { name: 'Testing & SE', subjects: ['Technical'], topics: ['software-engineering', 'oop'] },
          { name: 'Programming Basics', subjects: ['Coding'], topics: ['arrays', 'string'] },
        ],
      },
      {
        name: 'SQL & Data',
        description: 'SQL for test data validation.',
        modules: [
          { name: 'SQL for Testing', subjects: ['SQL'], topics: ['select-basics', 'where-filters', 'joins', 'group-by-aggregation'] },
        ],
      },
      {
        name: 'Interview Ready',
        description: 'Aptitude, verbal, and reasoning for placement rounds.',
        modules: [
          { name: 'Aptitude', subjects: ['Aptitude'], topics: ['percentages', 'time-and-work', 'data-interpretation', 'number-system'] },
          { name: 'Verbal', subjects: ['Verbal Ability'], topics: ['grammar', 'vocabulary', 'sentence-correction'] },
          { name: 'Reasoning', subjects: ['Logical Reasoning'], topics: ['series', 'odd-one-out', 'analogy'] },
        ],
      },
    ],
  },
];

module.exports.getPositionBySlug = function (slug) {
  return module.exports.positions.find((p) => p.slug === slug) || null;
};

module.exports.POSITION_SLUGS = module.exports.positions.map((p) => p.slug);
