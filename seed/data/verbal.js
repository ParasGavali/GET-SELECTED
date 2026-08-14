// Verbal ability questions. Every question is original, with a verified answer and explanation.
const q = (topic, text, options, correctOption, explanation, difficulty = 'medium', estimatedTime = 60) => ({
  topic, text, options, correctOption, explanation, difficulty, estimatedTime,
});

module.exports.verbal = [
  // Reading Comprehension
  q('reading-comprehension', 'Passage: "The Amazon rainforest produces about 20% of the world\'s oxygen and is home to millions of species. Yet it is being cleared at an alarming rate for agriculture and logging." What is the passage mainly about?', ['The economy of Brazil', 'The importance of the Amazon rainforest and its threats', 'The number of species in the Amazon', 'The history of agriculture'], 1, 'The passage highlights the rainforest\'s importance and the threats it faces.', 'medium', 80),
  q('reading-comprehension', 'Passage: "Regular exercise improves cardiovascular health, strengthens muscles, and boosts mental well-being. Experts recommend at least 30 minutes of moderate activity daily." Which of the following is NOT mentioned as a benefit of exercise?', ['Better cardiovascular health', 'Stronger muscles', 'Improved mental well-being', 'Weight loss guarantee'], 3, 'Weight loss guarantee is not mentioned.', 'easy', 60),
  q('reading-comprehension', 'Passage: "E-commerce has transformed retail. Customers can compare prices instantly, shop 24/7, and read reviews. However, physical stores still offer immediate gratification and personal service." What is a disadvantage of e-commerce implied in the passage?', ['No price comparison', 'No customer reviews', 'Lack of immediate gratification', 'High prices'], 2, 'Physical stores offer immediate gratification, implying e-commerce lacks it.', 'medium', 75),

  // Grammar
  q('grammar', 'Choose the correct sentence.', ['She don\'t like coffee.', 'She doesn\'t likes coffee.', 'She doesn\'t like coffee.', 'She not like coffee.'], 2, 'Third person singular requires "doesn\'t" + base verb.', 'easy', 40),
  q('grammar', 'Choose the correct form: "Neither of the answers ___ correct."', ['are', 'is', 'were', 'have been'], 1, '"Neither" is singular, so the verb is "is".', 'medium', 50),
  q('grammar', 'Choose the correctly punctuated sentence.', ['Whats your name?', 'What\'s your name.', 'What\'s your name?', 'What is your name'], 2, 'A question requires a question mark and "what\'s" needs an apostrophe.', 'easy', 40),
  q('grammar', '"I have lived here ___ 2015." Choose the correct preposition.', ['since', 'for', 'from', 'during'], 0, '"Since" is used with a point in time.', 'easy', 40),
  q('grammar', 'Choose the correct sentence:', ['The team are playing well today.', 'The team is playing well today.', 'The team is playing well today?', 'The team playing well today.'], 1, 'Collective noun "team" is singular here: "is".', 'medium', 50),

  // Vocabulary
  q('vocabulary', 'What is the meaning of "abundant"?', ['Rare', 'Plentiful', 'Difficult', 'Small'], 1, 'Abundant means plentiful or available in large quantity.', 'easy', 35),
  q('vocabulary', 'What is the meaning of "diligent"?', ['Lazy', 'Careful and hard-working', 'Quick-tempered', 'Wise'], 1, 'Diligent means showing care and persistent effort.', 'easy', 35),
  q('vocabulary', 'The word "benevolent" means?', ['Kind and generous', 'Cruel', 'Indifferent', 'Proud'], 0, 'Benevolent means well-meaning and kindly.', 'easy', 35),
  q('vocabulary', '"Candid" most nearly means?', ['Secretive', 'Honest and direct', 'Angry', 'Polite'], 1, 'Candid means truthful and straightforward.', 'easy', 35),

  // Sentence Correction
  q('sentence-correction', 'Identify the corrected sentence: "He go to school every day."', ['He goes to school every day.', 'He going to school every day.', 'He go to school everyday.', 'He gone to school every day.'], 0, 'Third person singular present: goes.', 'easy', 40),
  q('sentence-correction', 'Which is correct? "The committee ___ made its decision."', ['has', 'have', 'are', 'were'], 0, 'Committee is singular here: has.', 'medium', 50),
  q('sentence-correction', 'Choose the correct option: "Either Ravi or his friends ___ responsible."', ['is', 'are', 'was', 'has been'], 1, 'With "either/or", the verb agrees with the nearer subject (friends = plural), so "are".', 'hard', 70),
  q('sentence-correction', 'Correct the sentence: "I look forward to meet you."', ['I look forward to meeting you.', 'I look forward meet you.', 'I looks forward to meet you.', 'I looking forward to meet you.'], 0, 'After the preposition "to", the gerund "-ing" form is used.', 'medium', 55),

  // Synonyms
  q('synonyms', 'A synonym of "happy" is?', ['Sad', 'Joyful', 'Angry', 'Tired'], 1, 'Joyful means feeling happy.', 'easy', 30),
  q('synonyms', 'A synonym of "quick" is?', ['Slow', 'Rapid', 'Late', 'Heavy'], 1, 'Rapid means fast or quick.', 'easy', 30),
  q('synonyms', 'A synonym of "brave" is?', ['Cowardly', 'Courageous', 'Foolish', 'Shy'], 1, 'Courageous means brave.', 'easy', 30),
  q('synonyms', 'A synonym of "assist" is?', ['Hinder', 'Help', 'Delay', 'Watch'], 1, 'Assist means to help.', 'easy', 30),

  // Antonyms
  q('antonyms', 'An antonym of "permanent" is?', ['Temporary', 'Eternal', 'Fixed', 'Stable'], 0, 'Permanent means lasting; temporary means for a limited time.', 'easy', 30),
  q('antonyms', 'An antonym of "expand" is?', ['Grow', 'Contract', 'Spread', 'Increase'], 1, 'Expand means to grow; contract means to shrink.', 'easy', 30),
  q('antonyms', 'An antonym of "generous" is?', ['Kind', 'Stingy', 'Friendly', 'Brave'], 1, 'Generous means giving freely; stingy means unwilling to give.', 'easy', 30),
  q('antonyms', 'An antonym of "ancient" is?', ['Old', 'Modern', 'Aged', 'Historic'], 1, 'Ancient means very old; modern means recent.', 'easy', 30),

  // Para Jumbles
  q('para-jumbles', 'Arrange: 1. Therefore it is essential to stay hydrated. 2. Water regulates body temperature. 3. Every cell in the body depends on water. 4. Dehydration can impair brain function.', ['2,3,4,1', '3,2,4,1', '2,4,3,1', '3,4,2,1'], 0, 'Water regulates temperature (2), cells depend on water (3), dehydration harms the brain (4), conclusion (1). So 2,3,4,1.', 'hard', 80),
  q('para-jumbles', 'Arrange: 1. This makes online learning convenient. 2. Students can access lessons anytime. 3. However, it requires self-discipline. 4. Digital platforms host thousands of courses.', ['4,2,1,3', '2,4,1,3', '4,1,2,3', '2,1,4,3'], 0, 'Platforms (4), access anytime (2), convenience conclusion (1), however contrast (3). So 4,2,1,3.', 'hard', 80),

  // Fill in the Blanks
  q('fill-in-the-blanks', 'She is ___ than her sister.', ['more tall', 'taller', 'tallest', 'most tall'], 1, 'Comparative form: taller.', 'easy', 40),
  q('fill-in-the-blanks', 'The meeting was postponed ___ the rain.', ['because of', 'because', 'since of', 'for to'], 0, '"Because of" is followed by a noun phrase.', 'medium', 50),
  q('fill-in-the-blanks', 'He is not ___ to lift the box alone.', ['too strong', 'strong enough', 'enough strong', 'so strong'], 1, 'The pattern is "adjective + enough".', 'medium', 50),
  q('fill-in-the-blanks', 'We have been waiting ___ two hours.', ['since', 'for', 'during', 'at'], 1, '"For" is used with a duration of time.', 'easy', 40),
];
