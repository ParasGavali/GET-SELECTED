require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Question = require(path.join(__dirname, '..', 'models', 'Question'));

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function reshuffle() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('[reshuffle] Connected to MongoDB');

  const total = await Question.countDocuments({});
  console.log('[reshuffle] Total questions:', total);

  const BATCH = 500;
  let reshuffled = 0;
  let skipped = 0;
  let alreadyBalanced = 0;

  const stats = { A: 0, B: 0, C: 0, D: 0 };

  for (let skip = 0; skip < total; skip += BATCH) {
    const questions = await Question.find({}).skip(skip).limit(BATCH).lean();
    if (!questions.length) break;

    const bulkOps = [];

    for (const q of questions) {
      const opts = q.options;
      if (!opts || opts.length !== 4) { skipped++; continue; }

      const correctIdx = q.correctOption;
      if (typeof correctIdx !== 'number' || correctIdx < 0 || correctIdx > 3) { skipped++; continue; }

      const correctAnswer = opts[correctIdx];
      const wrongAnswers = opts.filter((_, i) => i !== correctIdx);

      // Shuffle all 4 options
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      const newCorrectIdx = allOptions.indexOf(correctAnswer);

      bulkOps.push({
        updateOne: {
          filter: { _id: q._id },
          update: { $set: { options: allOptions, correctOption: newCorrectIdx } }
        }
      });

      const labels = ['A', 'B', 'C', 'D'];
      stats[labels[newCorrectIdx]]++;
      reshuffled++;
    }

    if (bulkOps.length) {
      await Question.bulkWrite(bulkOps, { ordered: false });
    }

    if (skip % 2000 === 0 || skip + BATCH >= total) {
      console.log(`[reshuffle] Progress: ${Math.min(skip + BATCH, total)}/${total}`);
    }
  }

  console.log('\n[reshuffle] === RESULTS ===');
  console.log(`  Reshuffled: ${reshuffled}`);
  console.log(`  Skipped:    ${skipped}`);
  console.log('\nNew correct option distribution:');
  const totalReshuffled = reshuffled;
  for (const [label, count] of Object.entries(stats)) {
    const pct = totalReshuffled ? ((count / totalReshuffled) * 100).toFixed(1) : 0;
    console.log(`  ${label}: ${count} (${pct}%)`);
  }
  console.log('========================\n');

  await mongoose.disconnect();
  console.log('[reshuffle] Done.');
}

reshuffle().catch(err => { console.error('[reshuffle] Fatal:', err.message); process.exit(1); });
