// Lesson registry.
import t101 from './t101.js';
import t102 from './t102.js';
import t103 from './t103.js';
import t104 from './t104.js';
import t105a from './t105a.js';
import t105b from './t105b.js';
import t105c from './t105c.js';
import t105d from './t105d.js';
import t105e from './t105e.js';
import t106 from './t106.js';
import t201 from './t201.js';
import t202 from './t202.js';
import t203 from './t203.js';
import t204 from './t204.js';
import t205 from './t205.js';
import t206a from './t206a.js';
import t206b from './t206b.js';
import t206c from './t206c.js';
import tE201 from './tE201.js';
import t301 from './t301.js';
import t401 from './t401.js';
import t402 from './t402.js';
import t403 from './t403.js';
import t001 from './t001.js';
import t002 from './t002.js';
import t501 from './t501.js';

const LESSONS = Object.fromEntries([
  t101, t102, t103, t104, t105a, t105b, t105c, t105d, t105e, t106,
  t201, t202, t203, t204, t205, t206a, t206b, t206c, tE201,
  t301, t401, t402, t403, t001, t002, t501,
].map((l) => [l.id, l]));

export const getLesson = (id) => LESSONS[id] || null;
export const hasLesson = (id) => !!LESSONS[id];
export const allLessons = () => Object.values(LESSONS);
