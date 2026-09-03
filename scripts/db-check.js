require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Question = require(path.join(__dirname, '..', 'models', 'Question'));
const CodingProblem = require(path.join(__dirname, '..', 'models', 'CodingProblem'));
const Subject = require(path.join(__dirname, '..', 'models', 'Subject'));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  
  const totalQ = await Question.countDocuments({});
  const totalC = await CodingProblem.countDocuments({});
  console.log('Total Questions in DB:', totalQ);
  console.log('Total CodingProblems in DB:', totalC);
  console.log('Grand Total:', totalQ + totalC);
  
  const bySubject = await Question.aggregate([
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const subjects = await Subject.find({}).lean();
  const subMap = {};
  subjects.forEach(s => subMap[String(s._id)] = s.name);
  
  console.log('\nQuestions by Subject:');
  for (const r of bySubject) {
    console.log('  ', String(r.count).padStart(6), subMap[r._id] || r._id);
  }
  
  const byCorrect = await Question.aggregate([
    { $group: { _id: '$correctOption', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log('\nCorrect Option distribution:');
  const optLabels = ['A (index 0)', 'B (index 1)', 'C (index 2)', 'D (index 3)'];
  for (const r of byCorrect) {
    console.log('  ', String(r.count).padStart(6), optLabels[r._id] || 'index ' + r._id);
  }
  
  const byDiff = await CodingProblem.aggregate([
    { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('\nCoding Problems by Difficulty:');
  for (const r of byDiff) {
    console.log('  ', String(r.count).padStart(6), r._id);
  }
  
  const byCat = await CodingProblem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('\nCoding Problems by Category:');
  for (const r of byCat) {
    console.log('  ', String(r.count).padStart(6), r._id);
  }

  // Topics per subject
  const bySubjectTopic = await Question.aggregate([
    { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subj' } },
    { $lookup: { from: 'topics', localField: 'topic', foreignField: '_id', as: 'top' } },
    { $unwind: { path: '$subj', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$top', preserveNullAndEmptyArrays: true } },
    { $group: { _id: { subject: '$subj.name', topic: '$top.name' }, count: { $sum: 1 } } },
    { $sort: { '_id.subject': 1, count: -1 } }
  ]);
  console.log('\nQuestions by Subject > Topic:');
  let lastSubj = '';
  for (const r of bySubjectTopic) {
    const s = r._id.subject || 'Unknown';
    const t = r._id.topic || 'Unknown';
    if (s !== lastSubj) { console.log('\n  ' + s + ':'); lastSubj = s; }
    console.log('    ', String(r.count).padStart(6), t);
  }
  
  await mongoose.disconnect();
})();
