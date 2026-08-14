// SQL questions (MCQ type, subject SQL). Original, verified, with explanations.
const q = (topic, text, options, correctOption, explanation, difficulty = 'medium', estimatedTime = 60) => ({
  topic, text, options, correctOption, explanation, difficulty, estimatedTime, type: 'sql',
});

module.exports.sql = [
  // SELECT & Basics
  q('select-basics', 'Which query selects all columns from the students table?', ['SELECT * FROM students;', 'SELECT all FROM students;', 'SELECT columns FROM students;', 'GET * FROM students;'], 0, 'SELECT * retrieves all columns.', 'easy', 30),
  q('select-basics', 'Which keyword is used to retrieve data from a table?', ['INSERT', 'SELECT', 'UPDATE', 'DELETE'], 1, 'SELECT retrieves data.', 'easy', 30),
  q('select-basics', 'Which statement creates a new table?', ['CREATE TABLE students (...);', 'NEW TABLE students (...);', 'MAKE TABLE students (...);', 'ADD TABLE students (...);'], 0, 'CREATE TABLE defines a new table.', 'easy', 35),

  // WHERE & Filters
  q('where-filters', 'Which query finds students with a score above 80?', ['SELECT * FROM students WHERE score > 80;', 'SELECT * FROM students IF score > 80;', 'SELECT * FROM students HAVING score > 80;', 'SELECT * FROM students WHERE score ABOVE 80;'], 0, 'WHERE filters rows with a comparison.', 'easy', 40),
  q('where-filters', 'The LIKE operator with "%" matches?', ['Any single character', 'Any sequence of characters', 'Exact match only', 'Numbers only'], 1, '"%" in LIKE matches any sequence of characters.', 'medium', 45),
  q('where-filters', 'Which operator checks for NULL values?', ['= NULL', 'IS NULL', '== NULL', 'NULL IF'], 1, 'IS NULL is the correct way to check for NULL.', 'medium', 40),

  // JOINs
  q('joins', 'An INNER JOIN returns?', ['All rows from the left table', 'Only rows with matching values in both tables', 'All rows from both tables', 'Rows without matches'], 1, 'INNER JOIN returns only matched rows.', 'easy', 50),
  q('joins', 'Which join keeps all rows from the left table even without matches?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], 1, 'LEFT JOIN preserves all left-table rows.', 'easy', 45),
  q('joins', 'To combine students with their courses using a shared column, use?', ['JOIN ON the shared column', 'UNION tables', 'SELECT with comma only', 'MERGE statement'], 0, 'JOIN ... ON matches rows on a shared column.', 'medium', 55),

  // GROUP BY & Aggregation
  q('group-by-aggregation', 'Which function counts the number of rows?', ['SUM()', 'COUNT()', 'AVG()', 'TOTAL()'], 1, 'COUNT() returns the number of rows.', 'easy', 35),
  q('group-by-aggregation', 'To find the average score of all students: SELECT AVG(score) ... Which function computes the average?', ['SUM(score)', 'AVG(score)', 'COUNT(score)', 'MEAN(score)'], 1, 'AVG() computes the average.', 'easy', 35),
  q('group-by-aggregation', 'Which clause groups rows for aggregation?', ['GROUP BY', 'ORDER BY', 'WHERE', 'SORT BY'], 0, 'GROUP BY groups rows before aggregation.', 'easy', 40),

  // HAVING
  q('having', 'Which clause filters groups after aggregation?', ['WHERE', 'HAVING', 'LIMIT', 'FILTER'], 1, 'HAVING filters aggregated groups; WHERE filters rows first.', 'medium', 50),
  q('having', 'Find departments with more than 5 employees: SELECT dept, COUNT(*) FROM emp GROUP BY dept ___ COUNT(*) > 5;', ['WHERE', 'HAVING', 'AND', 'BEFORE'], 1, 'HAVING is used to filter groups.', 'medium', 45),

  // Subqueries
  q('subqueries', 'A subquery is?', ['A query inside another query', 'A query without a table', 'A stored procedure', 'An index'], 0, 'A subquery is a nested query used within another query.', 'easy', 45),
  q('subqueries', 'Which query selects students with scores above the average?', ['SELECT * FROM students WHERE score > (SELECT AVG(score) FROM students);', 'SELECT * FROM students WHERE score > AVG(score);', 'SELECT * FROM students ABOVE AVG(score);', 'SELECT * FROM students WHERE score > average;'], 0, 'The average must come from a subquery because aggregates cannot be used directly in WHERE.', 'medium', 60),

  // Window Functions
  q('window-functions', 'Which function assigns a sequential number to each row within a partition?', ['ROW_NUMBER()', 'COUNT()', 'SUM()', 'MAX()'], 0, 'ROW_NUMBER() assigns a unique sequential number per row.', 'medium', 55),
  q('window-functions', 'RANK() with ties assigns?', ['Unique numbers to all rows', 'Same rank to equal values with gaps', 'Same rank to equal values without gaps', 'Random ranks'], 1, 'RANK() gives equal values the same rank and leaves gaps.', 'hard', 70),
  q('window-functions', 'Which clause defines the partition for a window function?', ['PARTITION BY', 'GROUP BY', 'ORDER BY only', 'SPLIT BY'], 0, 'PARTITION BY defines groups inside a window function.', 'medium', 55),
];
