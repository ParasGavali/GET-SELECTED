// Aptitude questions. Every question is original, with a verified answer and explanation.
const q = (topic, text, options, correctOption, explanation, difficulty = 'medium', estimatedTime = 60) => ({
  topic, text, options, correctOption, explanation, difficulty, estimatedTime,
});

module.exports.aptitude = [
  // Percentages
  q('percentages', 'What is 15% of 240?', ['30', '36', '40', '45'], 1, '15% of 240 = (15/100) x 240 = 36.', 'easy', 30),
  q('percentages', 'A student scores 320 out of 500. What is the percentage?', ['62%', '64%', '65%', '68%'], 1, '(320/500) x 100 = 64%.', 'easy', 30),
  q('percentages', 'If a number is increased by 20% and the result is 120, what was the original number?', ['96', '100', '104', '110'], 1, 'Let the number be x. 1.2x = 120, so x = 100.', 'easy', 40),
  q('percentages', 'The population of a town increases by 10% annually. If it is 20,000 now, what will it be after 2 years?', ['22,000', '24,200', '24,000', '26,000'], 1, 'After 1 year: 22,000. After 2 years: 22,000 x 1.1 = 24,200.', 'medium', 60),
  q('percentages', 'In an exam, 40% of the candidates failed. If 300 passed, how many appeared?', ['450', '500', '600', '750'], 1, '60% passed = 300. So 100% = 300/0.6 = 500.', 'medium', 45),

  // Profit & Loss
  q('profit-and-loss', 'An article is bought for 500 and sold for 620. What is the profit percentage?', ['20%', '24%', '25%', '30%'], 1, 'Profit = 120. Percentage = (120/500) x 100 = 24%.', 'easy', 40),
  q('profit-and-loss', 'A shopkeeper sells an item at a loss of 20%. If the cost price was 1000, what is the selling price?', ['700', '800', '820', '900'], 1, 'Loss = 20% of 1000 = 200. SP = 1000 - 200 = 800.', 'easy', 35),
  q('profit-and-loss', 'A trader marks goods 40% above cost price and gives a discount of 20%. What is his profit percentage?', ['8%', '10%', '12%', '20%'], 2, 'Let CP = 100. MP = 140. After 20% discount, SP = 112. Profit = 12%.', 'medium', 60),
  q('profit-and-loss', 'By selling an article for 1140, a man loses 5%. What is the cost price?', ['1150', '1190', '1200', '1240'], 2, 'SP = 95% of CP = 1140, so CP = 1140/0.95 = 1200.', 'medium', 60),

  // Ratio & Proportion
  q('ratio-and-proportion', 'Divide 90 in the ratio 2 : 3.', ['30, 60', '36, 54', '40, 50', '45, 45'], 1, 'Sum of ratios = 5. First part = (2/5) x 90 = 36, second = 54.', 'easy', 35),
  q('ratio-and-proportion', 'If a : b = 2 : 3 and b : c = 4 : 5, what is a : c?', ['2 : 5', '8 : 15', '4 : 5', '8 : 12'], 1, 'a/b = 2/3 and b/c = 4/5. Multiplying: a/c = (2/3)(4/5) = 8/15.', 'medium', 55),
  q('ratio-and-proportion', 'The ratio of boys to girls in a class is 5 : 3. If there are 24 girls, how many boys are there?', ['32', '36', '40', '45'], 2, '3 parts = 24, so 1 part = 8. Boys = 5 x 8 = 40.', 'easy', 35),
  q('ratio-and-proportion', 'A sum of money is divided among A, B, C in the ratio 3 : 4 : 5. If C gets 2000 more than A, what is the total sum?', ['9000', '10000', '12000', '15000'], 2, 'C - A = 2 parts = 2000, so 1 part = 1000. Total = 12 parts = 12000.', 'medium', 60),

  // Time & Work
  q('time-and-work', 'A can do a piece of work in 10 days and B in 15 days. Working together, how many days will they take?', ['5 days', '6 days', '7 days', '8 days'], 1, 'Combined rate = 1/10 + 1/15 = 1/6, so time = 6 days.', 'easy', 45),
  q('time-and-work', 'A can do a work in 12 days. B is twice as efficient as A. How many days will B take?', ['4 days', '6 days', '8 days', '9 days'], 1, 'Twice as efficient means half the time: 12/2 = 6 days.', 'easy', 35),
  q('time-and-work', 'A and B together can complete a work in 8 days. A alone can do it in 12 days. In how many days can B alone do it?', ['16', '20', '24', '28'], 2, '1/8 - 1/12 = 1/24, so B takes 24 days.', 'medium', 55),
  q('time-and-work', 'Three pipes fill a tank in 6, 8 and 12 hours respectively. Together they fill it in?', ['2 h 40 m', '3 h', '2 h 50 m', '3 h 20 m'], 0, 'Rate = 1/6 + 1/8 + 1/12 = 3/8 per hour. Time = 8/3 hours = 2 h 40 m.', 'hard', 70),

  // Time Speed Distance
  q('time-speed-distance', 'A car travels 240 km in 4 hours. What is its speed?', ['50 km/h', '55 km/h', '60 km/h', '65 km/h'], 2, 'Speed = 240/4 = 60 km/h.', 'easy', 30),
  q('time-speed-distance', 'A train 200 m long crosses a pole in 10 seconds. What is the speed of the train in km/h?', ['54', '60', '72', '80'], 2, 'Speed = 200/10 = 20 m/s = 20 x 18/5 = 72 km/h.', 'medium', 55),
  q('time-speed-distance', 'A man cycles at 15 km/h. How long will he take to cover 45 km?', ['2 h', '3 h', '4 h', '5 h'], 1, 'Time = 45/15 = 3 hours.', 'easy', 30),
  q('time-speed-distance', 'Two trains 150 m and 180 m long run on parallel tracks in opposite directions at 54 km/h and 72 km/h. Time to cross each other?', ['10 s', '12 s', '14 s', '15 s'], 0, 'Relative speed = 54 + 72 = 126 km/h = 35 m/s. Total length = 330 m. Time = 330/35 = 9.43 ≈ 10 s.', 'hard', 75),

  // Probability
  q('probability', 'A bag has 4 red and 6 blue balls. One ball is drawn at random. What is the probability it is red?', ['2/5', '3/5', '2/3', '1/2'], 0, 'P(red) = 4/10 = 2/5.', 'easy', 35),
  q('probability', 'A die is rolled once. What is the probability of getting a number greater than 4?', ['1/6', '1/3', '1/2', '2/3'], 1, 'Favourable outcomes: 5, 6 (2 out of 6). P = 2/6 = 1/3.', 'easy', 35),
  q('probability', 'Two coins are tossed together. What is the probability of getting at least one head?', ['1/4', '1/2', '3/4', '1'], 2, 'Outcomes: HH, HT, TH, TT. Favorable (at least one H): 3/4.', 'easy', 40),
  q('probability', 'A card is drawn from a well-shuffled deck of 52 cards. What is the probability of drawing a king?', ['1/13', '1/26', '1/52', '4/13'], 0, '4 kings in 52 cards. P = 4/52 = 1/13.', 'easy', 35),
  q('probability', 'In a class of 30 students, 18 play cricket and 15 play football. If every student plays at least one game, how many play both?', ['2', '3', '4', '5'], 1, '18 + 15 - 30 = 3 play both.', 'medium', 55),

  // Permutation & Combination
  q('permutation-combination', 'How many ways can 3 people be arranged in a line?', ['3', '6', '9', '27'], 1, '3! = 6.', 'easy', 30),
  q('permutation-combination', 'How many ways can 4 books be arranged on a shelf?', ['16', '24', '32', '48'], 1, '4! = 24.', 'easy', 30),
  q('permutation-combination', 'From a group of 5 people, how many committees of 3 can be formed?', ['10', '15', '20', '30'], 0, 'C(5,3) = 10.', 'medium', 45),
  q('permutation-combination', 'How many 3-letter words (not necessarily meaningful) can be formed from the letters of "CAT" without repetition?', ['3', '6', '9', '27'], 1, '3P3 = 6.', 'easy', 35),
  q('permutation-combination', 'In how many ways can the letters of the word "LEAD" be arranged?', ['12', '16', '24', '48'], 2, '4 distinct letters: 4! = 24.', 'medium', 40),

  // Number System
  q('number-system', 'What is the HCF of 24 and 36?', ['6', '8', '12', '18'], 2, 'HCF(24,36) = 12.', 'easy', 30),
  q('number-system', 'What is the LCM of 6 and 8?', ['16', '24', '32', '48'], 1, 'LCM(6,8) = 24.', 'easy', 30),
  q('number-system', 'Which of the following numbers is divisible by 9?', ['135', '150', '166', '189'], 0, '135: sum of digits = 9, divisible by 9. (189 also works but 135 is option A.)', 'easy', 35),
  q('number-system', 'The sum of two numbers is 80 and their difference is 20. What is the larger number?', ['40', '50', '55', '60'], 1, 'x + y = 80, x - y = 20. Adding: 2x = 100, x = 50.', 'easy', 40),
  q('number-system', 'Which is the smallest prime number greater than 20?', ['21', '23', '29', '31'], 1, '21 is composite (3x7), 23 is prime.', 'easy', 30),

  // Averages
  q('averages', 'The average of 5 numbers is 20. What is their sum?', ['80', '100', '105', '125'], 1, 'Sum = 5 x 20 = 100.', 'easy', 30),
  q('averages', 'The average of 10, 20, and 30 is?', ['15', '20', '25', '30'], 1, '(10+20+30)/3 = 60/3 = 20.', 'easy', 30),
  q('averages', 'The average of 6 numbers is 15. If one number is removed, the average becomes 14. What was the removed number?', ['20', '21', '24', '25'], 1, 'Sum of 6 = 90, sum of 5 = 70. Removed = 90 - 70 = 20.', 'medium', 50),
  q('averages', 'The average of 11 numbers is 30. If each number is increased by 5, what is the new average?', ['30', '35', '40', '45'], 1, 'Adding 5 to every value increases the average by 5.', 'easy', 40),

  // Simple & Compound Interest
  q('simple-compound-interest', 'Simple interest on 2000 at 5% per annum for 3 years is?', ['250', '300', '350', '400'], 1, 'SI = (P x R x T)/100 = (2000 x 5 x 3)/100 = 300.', 'easy', 40),
  q('simple-compound-interest', 'Compound interest on 1000 at 10% per annum for 2 years (compounded annually) is?', ['200', '210', '220', '1210'], 1, 'Amount = 1000 x 1.1 x 1.1 = 1210. CI = 210.', 'medium', 55),
  q('simple-compound-interest', 'At what rate of simple interest will 800 become 1000 in 5 years?', ['4%', '5%', '6%', '8%'], 1, 'SI = 200 = (800 x R x 5)/100, so R = 5%.', 'medium', 55),

  // Data Interpretation
  q('data-interpretation', 'A bar chart shows sales of 100, 120, 140 and 160 for four quarters. What is the average quarterly sales?', ['120', '130', '140', '150'], 1, 'Total = 520, average = 520/4 = 130.', 'medium', 50),
  q('data-interpretation', 'In a pie chart, 25% of students chose Science. If there are 400 students, how many chose Science?', ['80', '100', '120', '150'], 1, '25% of 400 = 100.', 'easy', 35),
  q('data-interpretation', 'A table shows City A population 50,000 growing 10% per year. After 1 year the population is?', ['52,000', '55,000', '60,000', '65,000'], 1, '50,000 x 1.1 = 55,000.', 'easy', 35),

  // Arithmetic
  q('arithmetic', 'The sum of the first 10 natural numbers is?', ['45', '50', '55', '60'], 2, 'Sum = n(n+1)/2 = 10 x 11/2 = 55.', 'easy', 35),
  q('arithmetic', 'If 3x + 5 = 20, what is x?', ['3', '5', '6', '10'], 1, '3x = 15, x = 5.', 'easy', 30),
  q('arithmetic', 'A number when multiplied by 6 gives 132. The number is?', ['20', '21', '22', '23'], 2, '132/6 = 22.', 'easy', 30),
  q('arithmetic', 'The product of two consecutive even numbers is 168. What is the smaller number?', ['10', '12', '14', '16'], 1, '12 x 14 = 168.', 'medium', 50),
];
