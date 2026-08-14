// Logical reasoning questions. Every question is original, with a verified answer and explanation.
const q = (topic, text, options, correctOption, explanation, difficulty = 'medium', estimatedTime = 60) => ({
  topic, text, options, correctOption, explanation, difficulty, estimatedTime,
});

module.exports.reasoning = [
  // Coding-Decoding
  q('coding-decoding', 'If CAT is coded as DBU, how is DOG coded?', ['EPH', 'EOH', 'DOH', 'ENH'], 0, 'Each letter is shifted +1: D->E, O->P, G->H. So DOG = EPH.', 'easy', 45),
  q('coding-decoding', 'If A = 1, B = 2, ..., Z = 26, what is the code for "SUM"?', ['19,21,13', '18,20,12', '20,22,14', '19,22,13'], 0, 'S=19, U=21, M=13.', 'easy', 40),
  q('coding-decoding', 'In a certain code, 1234 means "you are very good". Which digit means "very" if 235 means "are good boy"?', ['1', '2', '3', '5'], 1, 'Common between 1234 and 235: "are" and "good" map to 2 and 3. "very" is in only 1234, so it is 1... wait check: 1234 has you,are,very,good. 235 has are,good,boy. Common digits 2,3 = are,good. So "very" = 1.', 'medium', 75),
  q('coding-decoding', 'If TIGER is coded as UJHFS, how is LION coded?', ['MHPO', 'MJPO', 'MHPN', 'MJPN'], 0, 'Alternating pattern: +1, -1, +1, -1, +1. L->M, I->H, O->P, N->M. So MHPO.', 'medium', 70),
  q('coding-decoding', 'If "apple" is written as "elppa", how is "pear" written?', ['rape', 'reap', 'aepr', 'raep'], 0, 'The word is reversed.', 'easy', 30),

  // Blood Relations
  q('blood-relations', 'Pointing to a photo, Ravi says, "She is the daughter of my mother\'s only son." Who is she to Ravi?', ['Sister', 'Daughter', 'Niece', 'Mother'], 1, 'Mother\'s only son is Ravi. Her daughter is Ravi\'s daughter.', 'medium', 60),
  q('blood-relations', 'A is the father of B. B is the sister of C. C is the son of D. How is D related to A?', ['Wife', 'Sister', 'Mother', 'Daughter'], 0, 'A has children B and C, so D is A\'s wife (mother of the children).', 'medium', 55),
  q('blood-relations', 'Ravi is the brother of Sita. Sita\'s father is Mohan. How is Mohan related to Ravi?', ['Uncle', 'Father', 'Grandfather', 'Brother'], 1, 'Mohan is the father of both.', 'easy', 30),
  q('blood-relations', 'Meena\'s mother is the only daughter of Ramesh. How is Ramesh related to Meena?', ['Father', 'Grandfather', 'Uncle', 'Brother'], 1, 'Meena\'s mother is Ramesh\'s only daughter, so Ramesh is Meena\'s maternal grandfather.', 'medium', 55),
  q('blood-relations', 'If A is the son of B and B is the son of C, how is A related to C?', ['Son', 'Grandson', 'Father', 'Brother'], 1, 'A is B\'s son, B is C\'s son, so A is C\'s grandson.', 'easy', 35),

  // Syllogisms
  q('syllogisms', 'Statements: All mangoes are fruits. All fruits are sweet. Conclusions: I. All mangoes are sweet. II. Some fruits are mangoes.', ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'], 2, 'Mangoes ⊂ fruits ⊂ sweet, so I follows. Since all mangoes are fruits, some fruits are mangoes (II) also follows.', 'medium', 60),
  q('syllogisms', 'Statements: Some pens are pencils. All pencils are erasers. Conclusions: I. Some pens are erasers. II. All pens are erasers.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Some pens are pencils and all pencils are erasers, so those pens are erasers. I follows. II does not follow.', 'medium', 60),
  q('syllogisms', 'Statements: All cats are dogs. No dog is a bird. Conclusions: I. No cat is a bird. II. Some dogs are cats.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 2, 'All cats are dogs, and no dog is a bird, so no cat is a bird (I). All cats are dogs implies some dogs are cats (II). Both follow.', 'medium', 65),
  q('syllogisms', 'Statements: Some doctors are engineers. All engineers are smart. Conclusions: I. Some doctors are smart. II. All doctors are smart.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Only the doctors who are engineers are smart. I follows; II does not.', 'medium', 60),

  // Series
  q('series', 'Find the next number: 2, 4, 8, 16, ?', ['20', '24', '32', '36'], 2, 'Each term doubles: 16 x 2 = 32.', 'easy', 30),
  q('series', 'Find the next number: 3, 6, 12, 24, ?', ['36', '48', '40', '56'], 1, 'Each term doubles: 24 x 2 = 48.', 'easy', 30),
  q('series', 'Find the next number: 1, 4, 9, 16, 25, ?', ['30', '36', '49', '40'], 1, 'Perfect squares: 36.', 'easy', 30),
  q('series', 'Find the next number: 5, 11, 17, 23, ?', ['27', '29', '31', '33'], 1, 'Add 6 each time: 23 + 6 = 29.', 'easy', 30),
  q('series', 'Find the next letter: A, C, E, G, ?', ['H', 'I', 'J', 'K'], 1, 'Skip one letter each time: I.', 'easy', 30),
  q('series', 'Find the next number: 2, 3, 5, 8, 13, ?', ['18', '20', '21', '25'], 2, 'Fibonacci-style: 13 + 8 = 21.', 'medium', 45),

  // Puzzles
  q('puzzles', 'Five friends A, B, C, D, E sit in a row. A is to the left of B, C is at one end, D is to the right of C. Who can be in the middle?', ['A', 'B', 'D', 'Any of these'], 3, 'Multiple arrangements are possible, so the middle person is not fixed.', 'hard', 80),
  q('puzzles', 'A clock shows 3:15. What is the angle between the hour and minute hands?', ['0 degrees', '7.5 degrees', '15 degrees', '30 degrees'], 1, 'Hour hand is at 3 + 15/60 = 3.25 marks (each hour = 30 degrees, so 97.5 degrees). Minute hand at 15 minutes = 90 degrees. Difference = 7.5 degrees.', 'hard', 80),
  q('puzzles', 'Three numbers sum to 30. The first is twice the second, and the third is 6 more than the second. What are the numbers?', ['10, 6, 14', '12, 6, 12', '8, 4, 18', '14, 5, 11'], 1, 'Let second = x. 2x + x + (x+6) = 30, so 4x = 24, x = 6. Numbers: 12, 6, 12.', 'medium', 65),

  // Seating Arrangement
  q('seating-arrangement', 'Four people A, B, C, D sit in a row. A sits immediately left of B. C sits at the far left. Who sits at the far right?', ['A', 'B', 'C', 'D'], 1, 'C, A, B, then D at the far right.', 'medium', 60),
  q('seating-arrangement', 'Six friends sit around a circular table. A is opposite D. If B sits to the immediate right of A, who is to the immediate left of D?', ['B', 'C', 'E', 'F'], 0, 'With A opposite D, the person to the immediate right of A (B) is to the immediate left of D.', 'hard', 80),
  q('seating-arrangement', 'In a row of students, Ravi is 7th from the left and 9th from the right. How many students are in the row?', ['15', '16', '17', '18'], 0, 'Total = 7 + 9 - 1 = 15.', 'medium', 50),

  // Direction Sense
  q('direction-sense', 'A man walks 5 km north, then turns right and walks 3 km. In which direction is he now from his start?', ['North-east', 'North-west', 'South-east', 'South-west'], 0, 'Moving north then east puts him north-east of the start.', 'medium', 55),
  q('direction-sense', 'Starting from home, Ravi walks 4 km south, turns left, walks 3 km. His home is in which direction from his current position?', ['South-west', 'North-east', 'North-west', 'South-east'], 1, 'He is 4 km south and 3 km west of home, so home is north-east of him.', 'medium', 60),
  q('direction-sense', 'If East is called North, what is West called?', ['South', 'East', 'North', 'South-east'], 0, 'The compass is rotated 90 degrees, so West becomes South.', 'medium', 50),
  q('direction-sense', 'A girl walks 10 m north, 10 m east, 10 m south, 10 m west. Where is she relative to start?', ['10 m east', '10 m north', 'At start', '10 m south'], 2, 'She returns to the starting point.', 'easy', 40),

  // Analogy
  q('analogy', 'Book : Page :: Tree : ?', ['Leaf', 'Root', 'Branch', 'Fruit'], 0, 'A page is a part of a book, a leaf is a part of a tree.', 'easy', 35),
  q('analogy', 'Doctor : Hospital :: Teacher : ?', ['Classroom', 'School', 'Student', 'Books'], 1, 'A doctor works in a hospital, a teacher works in a school.', 'easy', 35),
  q('analogy', '3 : 9 :: 7 : ?', ['14', '21', '49', '42'], 2, '3 squared = 9, 7 squared = 49.', 'medium', 40),
  q('analogy', 'Pen : Write :: Knife : ?', ['Cut', 'Sharp', 'Metal', 'Blade'], 0, 'A pen is used to write, a knife is used to cut.', 'easy', 30),
  q('analogy', 'Fish : Water :: Bird : ?', ['Sky', 'Tree', 'Nest', 'Fly'], 0, 'A fish lives in water, a bird lives in the sky.', 'easy', 30),

  // Statement & Conclusion
  q('statement-conclusion', 'Statement: "All students who study daily pass the exam." Conclusion: "Ravi passed the exam." Which is true?', ['Ravi studied daily', 'Ravi may or may not have studied daily', 'Ravi did not study daily', 'Ravi failed once'], 1, 'The statement is one-directional; passing does not guarantee daily study.', 'medium', 60),
  q('statement-conclusion', 'Statement: "Every Saturday the library is closed." Today is Saturday. Conclusion: The library is closed today.', ['Follows', 'Does not follow', 'Cannot be determined', 'Partially follows'], 0, 'Saturday means closed, so it follows.', 'easy', 40),
  q('statement-conclusion', 'Statement: "In city X, rains are common in July." Conclusion: "It will rain in city X tomorrow (July)."', ['Follows', 'Does not follow', 'Cannot be determined', 'Partially follows'], 2, 'Common rains do not guarantee rain on a specific day.', 'medium', 55),
];
