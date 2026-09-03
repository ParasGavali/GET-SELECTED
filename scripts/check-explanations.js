require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Question = require(path.join(__dirname, '..', 'models', 'Question'));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  // Sample 10 questions with different correctOptions
  const samples = await Question.find({}).limit(10).lean();
  console.log('Sample questions:');
  for (const q of samples) {
    const letters = ['A', 'B', 'C', 'D'];
    console.log('\n  Q:', q.text.substring(0, 100));
    console.log('  Options:', q.options.map((o, i) => letters[i] + ': ' + o.substring(0, 50)).join(' | '));
    console.log('  Correct:', letters[q.correctOption]);
    console.log('  Explanation:', (q.explanation || '').substring(0, 150));
  }

  // Check if explanations reference option letters
  const withExplanation = await Question.find({ explanation: { $ne: '' } }).limit(100).lean();
  let refA = 0, refB = 0, refC = 0, refD = 0, refNone = 0;
  for (const q of withExplanation) {
    const exp = (q.explanation || '').toLowerCase();
    if (exp.includes('option a') || exp.includes('answer a')) refA++;
    if (exp.includes('option b') || exp.includes('answer b')) refB++;
    if (exp.includes('option c') || exp.includes('answer c')) refC++;
    if (exp.includes('option d') || exp.includes('answer d')) refD++;
    if (!exp.includes('option') && !exp.includes('answer a') && !exp.includes('answer b') && !exp.includes('answer c') && !exp.includes('answer d')) refNone++;
  }
  console.log('\n\nExplanation letter references (sample of 100 with explanations):');
  console.log('  References Option A:', refA);
  console.log('  References Option B:', refB);
  console.log('  References Option C:', refC);
  console.log('  References Option D:', refD);
  console.log('  No option letter reference:', refNone);

  await mongoose.disconnect();
})();
