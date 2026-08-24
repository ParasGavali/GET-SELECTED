const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify/sync');

const CSV_IN = path.join(__dirname, '..', 'questions_final.csv');
const CSV_OUT = path.join(__dirname, '..', 'questions_cleaned.csv');
const REPORT_OUT = path.join(__dirname, '..', 'content_audit_report.txt');

const POSITION_TAGS = [
  'Software Engineer', 'Backend Developer', 'Frontend Developer',
  'Full Stack Developer', 'Data Analyst', 'Data Scientist',
  'AI/ML Engineer', 'QA/Test Engineer',
];

function lc(s) { return (s || '').toLowerCase().trim(); }
function hasAny(text, keywords) { return keywords.some(kw => text.includes(kw)); }

const APTITUDE_RULES = [
  { topic: 'Number System', sub: '', kw: ['hcf', 'lcm', 'gcd', 'divisible by', 'remainder', 'number system', 'factor', 'prime number', 'number of factors'] },
  { topic: 'Percentages', sub: '', kw: ['percent', 'percentage', '% of', 'increased by', 'decreased by', 'discount'] },
  { topic: 'Profit & Loss', sub: '', kw: ['profit', 'loss', 'cost price', 'selling price', 'cp', 'sp', 'marked price', 'discount'] },
  { topic: 'Ratio & Proportion', sub: '', kw: ['ratio', 'proportion', 'shares', 'divided in the ratio'] },
  { topic: 'Simple & Compound Interest', sub: '', kw: ['simple interest', 'compound interest', 'si on', 'ci on', 'interest rate', 'principal', 'amount becomes'] },
  { topic: 'Time & Work', sub: '', kw: ['can do', 'days to complete', 'working together', 'pipes', 'cistern', 'efficiency', 'man-days', 'work in'] },
  { topic: 'Time Speed Distance', sub: '', kw: ['km/h', 'kmph', 'm/s', 'speed', 'distance', 'train', 'boat', 'stream', 'upstream', 'downstream', 'passes a pole', 'passes a platform'] },
  { topic: 'Averages', sub: '', kw: ['average', 'mean of', 'weighted average'] },
  { topic: 'Probability', sub: '', kw: ['probability', 'probability of', 'chance'] },
  { topic: 'Permutation & Combination', sub: '', kw: ['permutation', 'combination', 'arrange', 'formed by', 'digits can be'] },
  { topic: 'Data Interpretation', sub: '', kw: ['pie chart', 'bar graph', 'table shows', 'chart shows', 'data shows', 'graph shows'] },
  { topic: 'Arithmetic', sub: '', kw: ['age', 'ages', 'family', 'sum of n observations', 'n observations', 'consecutive integers', 'odd days'] },
  { topic: 'Number System', sub: 'Divisibility', kw: ['divisible by 9', 'divisible by 11', 'divisible by'] },
];

const LOGICAL_RULES = [
  { topic: 'Series', sub: '', kw: ['next term', 'next number', 'find the series', 'number series', 'letter series', 'find the next', 'missing term', 'alternating', 'consecutive'] },
  { topic: 'Coding-Decoding', sub: '', kw: ['coded as', 'coding', 'decode', 'letter coding', 'if cat is coded', 'encoded', 'in a code', 'in certain code', 'if blue =', 'if money =', 'mirror code', 'each letter is replaced', 'represents', 'apple =', 'tree =', 'ride =', 'print =', 'if p =', 'if r =', 'sand =', 'gold =', 'code: a=', 'code: a =', 'if a = 1', 'if a=1', 'number coding', 'cat =', 'dog =', 'laptop =', 'keyboard =', "means '+'", "means '+'", "means '-'", "means '-'", "means '×'", "means 'x'"] },
  { topic: 'Blood Relations', sub: '', kw: ['blood relation', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'uncle', 'aunt', 'nephew', 'niece', 'husband', 'wife of'] },
  { topic: 'Direction Sense', sub: '', kw: ['direction', 'north', 'south', 'east', 'west', 'walks', 'turns left', 'turns right', 'facing'] },
  { topic: 'Syllogism', sub: '', kw: ['syllogism', 'all books are', 'some pens', 'conclusions:', 'statements:', 'follows', 'does not follow'] },
  { topic: 'Seating Arrangement', sub: '', kw: ['seating arrangement', 'sitting in a row', 'circular arrangement', 'linear arrangement', 'facing north', 'facing south', 'sit in a row', 'sit in a circle', 'sit in a line', 'sit around', 'sit in a', 'from left', 'from right', 'next to', 'not next to', 'opposite', 'extreme', 'between', '5 people', '6 people', 'boxes are stacked'] },
  { topic: 'Analogy', sub: '', kw: ['analogy', 'is to', 'as', ': ?'] },
  { topic: 'Odd One Out', sub: '', kw: ['odd one', 'does not belong', 'does not fit', 'find the odd'] },
  { topic: 'Puzzles', sub: '', kw: ['puzzle', 'conditions', 'which of the following'] },
  { topic: 'Statement & Conclusion', sub: '', kw: ['statement', 'conclusion', 'assumption', 'argument', 'implicit'] },
  { topic: 'Ranking', sub: '', kw: ['rank', 'ranking', 'position', 'from left', 'from right'] },
];

const VERBAL_RULES = [
  { topic: 'Synonyms', sub: '', kw: ['synonym', 'similar meaning'] },
  { topic: 'Antonyms', sub: '', kw: ['antonym', 'opposite meaning', 'opposite of'] },
  { topic: 'Grammar', sub: '', kw: ['grammar', 'grammatical', 'correct sentence', 'choose the correct', 'correct form', 'subject-verb agreement', 'passive voice', 'dangling modifier', 'tense', 'parallel structure', 'word order', 'apostrophe', 'fewer and less', 'who and whom', 'which sentence', 'identify the sentence', 'correct use of', 'comparative form', 'correct pronoun', 'correct use of articles', 'correct use', 'correct question'] },
  { topic: 'Vocabulary', sub: '', kw: ['vocabulary', 'meaning of', 'word that means', 'definition of'] },
  { topic: 'Sentence Correction', sub: '', kw: ['sentence correction', 'error in', 'correct the error', 'incorrect sentence'] },
  { topic: 'Fill in the Blanks', sub: '', kw: ['fill in', 'choose the word', 'most appropriate word'] },
  { topic: 'Para Jumbles', sub: '', kw: ['para jumble', 'rearrange', 'jumbled sentences', 'paragraph'] },
  { topic: 'Reading Comprehension', sub: '', kw: ['passage', 'reading comprehension', 'according to the passage'] },
  { topic: 'Idioms & Phrases', sub: '', kw: ['idiom', 'phrase', 'means'] },
  { topic: 'Error Detection', sub: '', kw: ['error detection', 'find the error', 'part with error'] },
  { topic: 'Sentence Completion', sub: '', kw: ['sentence completion', 'complete the sentence'] },
];

const TECHNICAL_RULES = [
  { topic: 'DBMS', sub: '', kw: ['dbms', 'database', 'normalization', 'acid', 'transaction', 'er model', 'relational', 'sql concepts', 'foreign key', 'primary key', 'candidate key', 'btree', 'indexing', 'join', 'outer join'] },
  { topic: 'Operating Systems', sub: '', kw: ['operating system', 'process', 'thread', 'scheduling', 'deadlock', 'memory management', 'virtual memory', 'file system', 'semaphore', 'mutex', 'pcb', 'context switch', 'round robin', 'fcfs', 'sjf', 'paging', 'segmentation'] },
  { topic: 'Computer Networks', sub: '', kw: ['tcp', 'udp', 'osi', 'http', 'https', 'dns', 'ip address', 'network', 'routing', 'socket', 'port', 'arp', 'icmp', 'ethernet', 'mac address', 'subnet', 'firewall', 'ssl', 'tls', 'protocol'] },
  { topic: 'OOP', sub: '', kw: ['object oriented', 'oop', 'class', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'interface', 'abstract class', 'virtual function', 'overloading', 'overriding', 'constructor', 'destructor', 'solid principle'] },
  { topic: 'Software Engineering', sub: '', kw: ['sdlc', 'agile', 'waterfall', 'testing', 'unit testing', 'integration testing', 'regression', 'black box', 'white box', 'version control', 'git', 'scrum', 'kanban'] },
  { topic: 'Computer Fundamentals', sub: '', kw: ['binary', 'hexadecimal', 'octal', 'cache', 'register', 'bus', 'compiler', 'interpreter', 'assembler', 'volatile memory', 'ram', 'rom', 'flip flop', 'boolean', 'gate', 'multiplexer', 'decoder', 'microprocessor', 'microcontroller', 'architecture', 'pipelining'] },
  { topic: 'DevOps', sub: '', kw: ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'pipeline', 'container', 'microservice', 'terraform', 'ansible', 'cloud', 'aws', 'azure', 'deployment'] },
  { topic: 'React', sub: '', kw: ['react', 'component', 'usestate', 'useeffect', 'props', 'virtual dom', 'jsx', 'hook', 'redux', 'usecallback', 'usememo', 'usecontext', 'lifecycle', 're-render', 'state management'] },
  { topic: 'SAP', sub: '', kw: ['sap', 'abap', 'module', 'bapi', 'idoc', 'hana', 'fiori', 's/4hana', 'erp', 'customizing'] },
  { topic: 'AI & ML', sub: '', kw: ['machine learning', 'deep learning', 'neural network', 'artificial intelligence', 'ai ', ' ml ', 'supervised', 'unsupervised', 'reinforcement', 'classification', 'regression', 'clustering', 'nlp', 'natural language', 'cnn', 'rnn', 'transformer', 'gradient descent', 'backpropagation', 'overfitting', 'underfitting', 'training data', 'model', 'feature', 'hyperparameter'] },
  { topic: 'Programming Fundamentals', sub: '', kw: ['variable', 'array', 'pointer', 'reference', 'loop', 'recursion', 'function', 'stack', 'queue', 'linked list', 'tree', 'graph', 'algorithm', 'time complexity', 'big o', 'sort', 'search', 'hash', 'compile', 'runtime', 'output of', 'print(', 'what does', 'character set', 'data type', 'string function'] },
];

const SQL_RULES = [
  { topic: 'SELECT & Basics', sub: '', kw: ['select', 'from', 'where', 'order by', 'distinct', 'alias', 'limit', 'offset', 'column'] },
  { topic: 'JOINs', sub: '', kw: ['join', 'inner join', 'left join', 'right join', 'full join', 'cross join', 'self join', 'natural join'] },
  { topic: 'GROUP BY & Aggregation', sub: '', kw: ['group by', 'count', 'sum', 'avg', 'max', 'min', 'aggregate', 'having'] },
  { topic: 'Subqueries', sub: '', kw: ['subquery', 'nested query', 'in (select', 'exists', 'any', 'all'] },
  { topic: 'Window Functions', sub: '', kw: ['window function', 'row_number', 'rank', 'dense_rank', 'lead', 'lag', 'over (', 'partition by'] },
  { topic: 'WHERE & Filters', sub: '', kw: ['where', 'between', 'like', 'in (', 'is null', 'is not null', 'and', 'or', 'not'] },
  { topic: 'HAVING', sub: '', kw: ['having'] },
];

const COMPREHENSIVE_APTITUDE_KW = [
  'rs.', 'rupees', 'shopkeeper', 'bought', 'sold', 'article', 'price of', 'cost of',
  'train travels', 'train is', 'km in', 'm in', 'speed of', 'sound travels',
  'compound interest', 'simple interest', 'interest at', 'interest compounded',
  'hcf of', 'lcm of', 'gcd of',
  '% of', 'percent', 'percentage',
  'profit', 'loss',
  'ratio', 'proportion',
  'average of', 'mean of', 'arithmetic mean', 'median of',
  'days to', 'can complete', 'can do a', 'working together',
  'probability', 'chance',
  'permutation', 'combination',
  'odd days', 'calendar',
  'clock', 'angle',
  'two numbers', 'product of', 'sum of two',
  'divisible by',
  'area of', 'volume of',
  'if a man', 'if a woman',
  'a person', 'a shopkeeper', 'a trader',
  'population', 'increase by', 'decrease by',
  'selection', 'choosing',
  'data interpretation', 'pie chart', 'bar graph',
  'aptitude', 'quantitative',
  'number of', 'find the value',
  'algebra', 'equation', 'quadratic',
  'quartile deviation', 'mean deviation', 'standard deviation', 'variance of',
  'coefficient of', 'reciprocal of',
  'worker', 'construction', 'efficiency',
  'bought for', 'sold for', 'gain', 'sp of', 'cp of',
  'man', 'woman', 'together in', 'alone in',
  'two fifth', 'three fourth', 'one third', 'half of',
  'first quartile', 'third quartile',
  'consecutive', 'natural number', 'odd nos', 'even number',
  'a + b', 'a + b =', 'abc =',
  'cylinder', 'sphere', 'cone', 'radius and height',
  'what is the value', 'find the difference',
  'of first', 'of the following', 'what is',
  'fortnight', 'kilogram', 'litre',
  'subtract', 'sum of', 'difference between',
  'identify the letter', 'does not belong', 'find the range', 'tethered', 'plot of',
  'the value of', 'value of is', 'the value of $$',
  'then x =', 'then x+', 'if 8^', 'if 1x',
  '116÷', '÷534', '÷141', 'of225',
  'find the odd one', 'does not belong',
];

function classifyAptitude(text) {
  for (const rule of APTITUDE_RULES) {
    if (hasAny(text, rule.kw)) return { topic: rule.topic, sub: rule.sub };
  }
  return { topic: 'Aptitude', sub: '' };
}

function classifyLogical(text) {
  for (const rule of LOGICAL_RULES) {
    if (hasAny(text, rule.kw)) return { topic: rule.topic, sub: rule.sub };
  }
  return { topic: 'General', sub: '' };
}

function classifyVerbal(text) {
  if (text.includes('_____') || text.includes('______') || text.includes('____')) {
    return { topic: 'Fill in the Blanks', sub: '' };
  }
  for (const rule of VERBAL_RULES) {
    if (hasAny(text, rule.kw)) return { topic: rule.topic, sub: rule.sub };
  }
  return { topic: 'General', sub: '' };
}

function classifyTechnical(text, options) {
  const combined = text + ' ' + options.join(' ');
  for (const rule of TECHNICAL_RULES) {
    if (hasAny(combined, rule.kw)) return { topic: rule.topic, sub: rule.sub };
  }
  return { topic: 'General', sub: '' };
}

function classifySQL(text, options) {
  const combined = text + ' ' + options.join(' ');
  for (const rule of SQL_RULES) {
    if (hasAny(combined, rule.kw)) return { topic: rule.topic, sub: rule.sub };
  }
  return { topic: 'General', sub: '' };
}

function isCodingProblem(text, type) {
  if (type !== 'coding') return false;
  const t = text.toLowerCase();
  const NON_CODING_SIGNALS = [
    'why do you want', 'what do you know about', 'tell me about yourself',
    'greatest learning', 'how quickly can you', 'what is your',
    'describe a time', 'where do you see', 'what motivates',
    'team work', 'leadership', 'weakness', 'strength',
    'salary expectation', 'join tcs', 'join infosys', 'join amazon',
    'adapt to new', 'what are your hobbies',
    'compression is a process', 'interview experience', 'selected out of',
    'there was no negative marking', 'result announced',
  ];
  if (NON_CODING_SIGNALS.some(s => t.includes(s))) return false;
  const CODING_SIGNALS = [
    'leetcode.com', 'given an array', 'given a string', 'given a linked',
    'find the', 'return the', 'write a function', 'implement', 'reverse a',
    'sort the', 'maximum element', 'minimum element', 'subsequence',
    'substring', 'palindrome', 'anagram', 'binary tree', 'binary search',
    'shortest path', 'longest', 'count the number of', 'determine whether',
    'check if', 'two sum', 'remove duplicates', 'merge',
  ];
  return CODING_SIGNALS.some(s => t.includes(s));
}

function isInterviewQuestion(text, type) {
  const t = text.toLowerCase();
  if (type === 'coding') {
    return ['why do you want', 'what do you know about', 'tell me about',
      'greatest learning', 'how quickly can you', 'what is your',
      'describe a time', 'where do you see', 'adapt to new',
      'compression is a process', 'interview experience', 'selected out of',
      'there was no negative marking', 'result announced'].some(s => t.includes(s));
  }
  return false;
}

function assignPositionTags(subject, topic) {
  const tags = [];
  if (subject === 'Aptitude' || subject === 'Logical Reasoning' || subject === 'Verbal Ability') {
    return ['Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Analyst', 'QA/Test Engineer'];
  }
  if (subject === 'SQL') {
    return ['Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist'];
  }
  if (subject === 'Technical') {
    if (topic === 'React') return ['Frontend Developer', 'Full Stack Developer'];
    if (topic === 'DevOps') return ['Backend Developer', 'Full Stack Developer', 'QA/Test Engineer'];
    if (topic === 'SAP') return ['Software Engineer'];
    if (topic === 'AI & ML') return ['AI/ML Engineer', 'Data Scientist'];
    return ['Software Engineer', 'Backend Developer', 'QA/Test Engineer'];
  }
  return [];
}

function assignCompanyTags(rec) {
  const raw = lc(rec.company_tags || '');
  if (!raw || raw.length < 2) return '';
  const companies = (rec.company_tags || '').split('|').map(c => c.trim()).filter(Boolean);
  const valid = ['tcs', 'infosys', 'wipro', 'accenture', 'amazon', 'microsoft', 'google', 'cognizant', 'hcltech', 'tech mahindra', 'capgemini', 'ibm', 'oracle', 'dell', 'hp', 'samsung', 'adobe', 'meta', 'apple', 'linkedin', 'flipkart', 'byju', 'zoho', 'freshworks', 'atlassian', 'salesforce'];
  const filtered = companies.filter(c => valid.includes(c.toLowerCase()));
  return filtered.length > 0 ? filtered.join('|') : '';
}

async function main() {
  console.log('[classify] Reading CSV...');
  const records = [];
  const parser = fs.createReadStream(CSV_IN).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true, relax_column_count: true, relax_quotes: true })
  );
  for await (const r of parser) records.push(r);
  console.log('[classify] Read', records.length, 'records');

  const stats = {
    total: records.length,
    subjectChanged: 0,
    topicChanged: 0,
    typeChanged: 0,
    interviewMoved: 0,
    reclassified: { Aptitude: 0, 'Verbal Ability': 0, 'Logical Reasoning': 0, Technical: 0, SQL: 0 },
    topicDistribution: {},
    subjectDistribution: {},
    typeDistribution: {},
    generalCount: 0,
  };

  const cleaned = [];

  for (const rec of records) {
    const out = { ...rec };
    const text = lc(rec.question_text || '');
    const rawType = lc(rec.question_type || '');
    const rawSubject = (rec.subject || '').trim();
    const rawTopic = (rec.topic || '').trim();
    const options = [rec.option_a, rec.option_b, rec.option_c, rec.option_d].map(lc);

    const oldSubject = rawSubject;
    const oldTopic = rawTopic;
    let newSubject = rawSubject;
    let newTopic = rawTopic;
    let newSubtopic = (rec.subtopic || '').trim();
    let newType = rawType === 'numerical' ? 'mcq' : rawType;

    if (rawType === 'coding') {
      if (isInterviewQuestion(text, 'coding')) {
        newType = 'mcq';
        newSubject = 'Technical';
        newTopic = 'General';
        newSubtopic = 'Interview Question';
        stats.typeChanged++;
        stats.interviewMoved++;
        stats.reclassified.Technical++;
      } else {
        const aptScore = COMPREHENSIVE_APTITUDE_KW.filter(kw => text.includes(kw)).length;
        if (aptScore >= 2 && !isCodingProblem(text, 'coding')) {
          newType = 'mcq';
          const result = classifyAptitude(text);
          newSubject = 'Aptitude';
          newTopic = result.topic;
          newSubtopic = result.sub;
          stats.typeChanged++;
          stats.reclassified.Aptitude++;
        } else {
          newSubject = 'Coding';
          newTopic = rawTopic || 'DSA';
        }
      }
    } else {
      if (rawSubject === 'Aptitude' || (rawSubject === 'Technical' && (rawTopic === 'General' || rawTopic === 'Computer Fundamentals' || rawTopic === 'Programming Fundamentals'))) {
        const aptScore = COMPREHENSIVE_APTITUDE_KW.filter(kw => text.includes(kw)).length;
        const techScore = TECHNICAL_RULES.reduce((s, r) => s + (hasAny(text, r.kw) ? 1 : 0), 0);

        if (aptScore > 0 && aptScore >= techScore) {
          const result = classifyAptitude(text);
          newSubject = 'Aptitude';
          newTopic = result.topic;
          newSubtopic = result.sub;
          if (oldSubject !== 'Aptitude') stats.reclassified.Aptitude++;
        } else if (rawSubject === 'Aptitude') {
          const result = classifyAptitude(text);
          newTopic = result.topic;
          newSubtopic = result.sub;
        }
      }

      if (rawSubject === 'Verbal Ability' || (rawSubject === 'Technical' && rawTopic === 'Programming Fundamentals' && hasAny(text, ['synonym', 'antonym', 'word', 'sentence', 'grammar', 'phrase', 'idiom']))) {
        const result = classifyVerbal(text);
        newSubject = 'Verbal Ability';
        newTopic = result.topic;
        newSubtopic = result.sub;
        if (oldSubject !== 'Verbal Ability') stats.reclassified['Verbal Ability']++;
      }

      if (rawSubject === 'Logical Reasoning') {
        const aptScore = COMPREHENSIVE_APTITUDE_KW.filter(kw => text.includes(kw)).length;
        if (aptScore >= 2) {
          const result = classifyAptitude(text);
          newSubject = 'Aptitude';
          newTopic = result.topic;
          newSubtopic = result.sub;
          stats.reclassified.Aptitude++;
        } else {
          const result = classifyLogical(text);
          newTopic = result.topic;
          newSubtopic = result.sub;
        }
      }

      if (rawSubject === 'SQL') {
        const result = classifySQL(text, options);
        newTopic = result.topic;
        newSubtopic = result.sub;
      }

      if (rawSubject === 'Technical' && newSubject === 'Technical') {
        const interviewKw = ['tell me about yourself', 'why do you want to join', 'what do you know about', 'where do you see yourself', 'biggest achievement', 'teamwork experience', 'tell me about your', 'what motivates', 'greatest learning', 'how quickly can you'];
        if (interviewKw.some(kw => text.includes(kw))) {
          newTopic = 'Interview Prep';
          newSubtopic = '';
        } else if (!['React', 'DevOps', 'SAP', 'AI & ML'].includes(newTopic)) {
          const result = classifyTechnical(text, options);
          if (result.topic !== 'General' || newTopic === 'General') {
            newTopic = result.topic;
            newSubtopic = result.sub;
          }
        }
      }

      if (newSubject === 'Technical' && newTopic === 'General') {
        const aptScore = COMPREHENSIVE_APTITUDE_KW.filter(kw => text.includes(kw)).length;
        if (aptScore >= 1) {
          const result = classifyAptitude(text);
          newSubject = 'Aptitude';
          newTopic = result.topic;
          newSubtopic = result.sub;
          stats.reclassified.Aptitude++;
        } else {
          const logScore = LOGICAL_RULES.reduce((s, r) => s + (hasAny(text, r.kw) ? 1 : 0), 0);
          if (logScore > 0) {
            const result = classifyLogical(text);
            newSubject = 'Logical Reasoning';
            newTopic = result.topic;
            newSubtopic = result.sub;
            stats.reclassified['Logical Reasoning']++;
          }
        }
      }

      if (newSubject === 'Aptitude' && newTopic === 'Aptitude') {
        const result = classifyAptitude(text);
        newTopic = result.topic;
        newSubtopic = result.sub;
      }
    }

    out.question_type = newType === 'numerical' ? 'mcq' : (newType === 'sql' ? 'sql' : newType);
    out.subject = newSubject;
    out.topic = newTopic;
    out.subtopic = newSubtopic;

    if (newSubject !== oldSubject) stats.subjectChanged++;
    if (newTopic !== oldTopic) stats.topicChanged++;
    if (newSubject !== 'Coding') {
      out.position_tags = assignPositionTags(newSubject, newTopic).join('|');
    }
    out.company_tags = assignCompanyTags(rec);

    stats.topicDistribution[newTopic] = (stats.topicDistribution[newTopic] || 0) + 1;
    stats.subjectDistribution[newSubject] = (stats.subjectDistribution[newSubject] || 0) + 1;
    stats.typeDistribution[out.question_type] = (stats.typeDistribution[out.question_type] || 0) + 1;
    if (newTopic === 'General') stats.generalCount++;

    cleaned.push(out);
  }

  const output = stringify(cleaned, { header: true });
  fs.writeFileSync(CSV_OUT, output);
  console.log('[classify] Wrote', cleaned.length, 'records to', CSV_OUT);

  let report = '=== CONTENT AUDIT REPORT ===\n';
  report += 'Generated: ' + new Date().toISOString() + '\n\n';
  report += 'BEFORE (from questions_final.csv):\n';
  report += '  Total records: ' + stats.total + '\n\n';
  report += 'AFTER (questions_cleaned.csv):\n';
  report += '  Subject changes: ' + stats.subjectChanged + '\n';
  report += '  Topic changes: ' + stats.topicChanged + '\n';
  report += '  Interview questions moved from Coding: ' + stats.interviewMoved + '\n\n';
  report += 'Subject distribution (after):\n';
  Object.entries(stats.subjectDistribution).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => report += '  ' + String(v).padStart(6) + ' ' + k + '\n');
  report += '\nTopic distribution (after, top 30):\n';
  Object.entries(stats.topicDistribution).sort((a,b) => b[1]-a[1]).slice(0,30).forEach(([k,v]) => report += '  ' + String(v).padStart(6) + ' ' + k + '\n');
  report += '\nType distribution (after):\n';
  Object.entries(stats.typeDistribution).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => report += '  ' + String(v).padStart(6) + ' ' + k + '\n');
  report += '\nGeneral topic count (after): ' + stats.generalCount + '\n';
  report += '\nReclassification counts:\n';
  Object.entries(stats.reclassified).forEach(([k,v]) => report += '  ' + String(v).padStart(6) + ' to ' + k + '\n');
  fs.writeFileSync(REPORT_OUT, report);
  console.log('[classify] Report written to', REPORT_OUT);
  console.log('\n' + report);
}

main().catch(e => { console.error('[classify] Fatal:', e.message); process.exit(1); });
