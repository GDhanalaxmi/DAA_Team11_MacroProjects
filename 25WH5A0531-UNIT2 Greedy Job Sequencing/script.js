// Greedy Job Sequencing with Deadlines
// Each job takes one unit of time. Jobs are processed by descending profit and
// placed in the latest open slot at or before their deadline.
const DEFAULT_JOBS = [
  { id: 'J1', deadline: 2, profit: 100 },
  { id: 'J2', deadline: 1, profit: 19 },
  { id: 'J3', deadline: 2, profit: 27 },
  { id: 'J4', deadline: 1, profit: 25 },
  { id: 'J5', deadline: 3, profit: 15 }
];

const $ = (id) => document.getElementById(id);
const jobsBody = $('jobs-body');
let run = null;
let autoTimer = null;

function renderInputJobs(jobs = DEFAULT_JOBS) {
  jobsBody.replaceChildren();
  jobs.forEach((job) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td><input aria-label="Job ID" data-field="id" maxlength="8" value="${escapeHtml(job.id)}"></td>
      <td><input aria-label="Deadline" data-field="deadline" type="number" min="1" step="1" value="${job.deadline}"></td>
      <td><input aria-label="Profit" data-field="profit" type="number" min="1" step="1" value="${job.profit}"></td>
      <td><button class="remove-job" type="button" aria-label="Remove job">×</button></td>`;
    row.querySelector('.remove-job').addEventListener('click', () => {
      row.remove();
      invalidateRun();
    });
    row.querySelectorAll('input').forEach((input) => input.addEventListener('input', invalidateRun));
    jobsBody.append(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function readJobs() {
  const jobs = [...jobsBody.querySelectorAll('tr')].map((row) => {
    const values = Object.fromEntries([...row.querySelectorAll('input')].map((input) => [input.dataset.field, input.value.trim()]));
    return { id: values.id, deadline: Number(values.deadline), profit: Number(values.profit) };
  });
  const error = $('input-error');
  if (!jobs.length) return showInputError('Add at least one job to begin.');
  if (jobs.some((job) => !job.id || !Number.isInteger(job.deadline) || job.deadline < 1 || !Number.isInteger(job.profit) || job.profit < 1)) {
    return showInputError('Enter a job ID and positive whole numbers for every deadline and profit.');
  }
  if (new Set(jobs.map((job) => job.id.toLowerCase())).size !== jobs.length) return showInputError('Each job ID must be unique.');
  error.hidden = true;
  return jobs;
}

function showInputError(message) {
  $('input-error').textContent = message;
  $('input-error').hidden = false;
  return null;
}

function invalidateRun() {
  stopAuto();
  run = null;
  $('next').disabled = true;
  $('auto').disabled = true;
  $('step-count').textContent = 'Needs restart';
  $('message').textContent = 'Jobs changed. Press Start to prepare the updated list.';
  $('current-job').textContent = $('current-deadline').textContent = $('current-profit').textContent = '—';
  $('sorted-jobs').className = 'job-chips empty';
  $('sorted-jobs').textContent = 'Jobs appear here when you start.';
  $('slots').className = 'slots empty';
  $('slots').textContent = 'Start to create slots from the deadlines.';
  $('skipped-jobs').className = 'skipped-list empty';
  $('skipped-jobs').textContent = 'None';
  $('total-profit').textContent = '0'; $('scheduled-count').textContent = '0';
  $('result-sequence').textContent = 'Waiting for the algorithm…';
  $('final-profit').textContent = '—';
  $('result-summary').textContent = 'Your result will appear here after all jobs are processed.';
  $('example-check').hidden = true;
  clearFlow();
}

function startRun() {
  stopAuto();
  const jobs = readJobs();
  if (!jobs) return;
  // Stable tie handling: for equal profits, preserve input order.
  const sorted = jobs.map((job, index) => ({ ...job, originalIndex: index }))
    .sort((a, b) => b.profit - a.profit || a.originalIndex - b.originalIndex);
  const maxDeadline = Math.max(...jobs.map((job) => job.deadline));
  run = { jobs, sorted, slots: Array(Math.min(maxDeadline, jobs.length)).fill(null), index: 0, current: null,
    phase: 'ready', total: 0, skipped: [], processed: 0, step: 0, lastSlot: -1 };
  renderSorted(); renderSlots(); renderSkipped(); clearFlow();
  $('message').textContent = 'Jobs are ready. Click Next step to sort them by profit.';
  $('current-job').textContent = $('current-deadline').textContent = $('current-profit').textContent = '—';
  $('total-profit').textContent = '0'; $('scheduled-count').textContent = '0';
  $('result-sequence').textContent = 'Waiting for the algorithm…'; $('final-profit').textContent = '—';
  $('result-summary').textContent = 'Your result will appear here after all jobs are processed.';
  $('example-check').hidden = true;
  $('next').disabled = false; $('auto').disabled = false; $('step-count').textContent = 'Ready';
  setFlow('start');
}

function nextStep() {
  if (!run || run.phase === 'done') return;
  run.step++;
  run.lastSlot = -1;
  if (run.phase === 'ready') {
    run.phase = run.sorted.length ? 'consider' : 'finish';
    $('message').textContent = `Jobs sorted by profit: ${run.sorted.map((job) => job.id).join(' → ')}.`;
    $('current-job').textContent = '—'; $('current-deadline').textContent = '—'; $('current-profit').textContent = '—';
    setFlow('sort');
  } else if (run.phase === 'consider') {
    if (run.index >= run.sorted.length) {
      run.phase = 'finish';
      run.step--;
      return nextStep();
    }
    run.current = run.sorted[run.index];
    run.phase = 'decide';
    $('message').textContent = `Considering ${run.current.id} — Profit = ${run.current.profit}, Deadline = ${run.current.deadline}.`;
    $('current-job').textContent = run.current.id; $('current-deadline').textContent = run.current.deadline; $('current-profit').textContent = run.current.profit;
    renderSorted(); setFlow('select');
  } else if (run.phase === 'decide') {
    const lastPossible = Math.min(run.current.deadline, run.slots.length) - 1;
    let openSlot = -1;
    for (let i = lastPossible; i >= 0; i--) if (!run.slots[i]) { openSlot = i; break; }
    if (openSlot >= 0) {
      run.slots[openSlot] = run.current; run.total += run.current.profit; run.processed++; run.lastSlot = openSlot;
      $('message').textContent = `Slot ${openSlot + 1} is available, so ${run.current.id} is scheduled there.`;
      setFlow('schedule');
    } else {
      run.skipped.push(run.current); run.processed++;
      $('message').textContent = `No slot is available on or before deadline ${run.current.deadline}, so ${run.current.id} is skipped.`;
      setFlow('skip');
    }
    run.index++; run.phase = run.index < run.sorted.length ? 'consider' : 'finish';
    renderSlots(); renderSkipped(); renderSorted();
    $('total-profit').textContent = run.total; $('scheduled-count').textContent = run.processed - run.skipped.length;
  } else if (run.phase === 'finish') {
    run.phase = 'done';
    showFinalResult();
    $('next').disabled = true; $('auto').disabled = true;
    setFlow('end');
  }
  $('step-count').textContent = `Step ${run.step}`;
}

function renderSorted() {
  const container = $('sorted-jobs');
  container.className = 'job-chips'; container.replaceChildren();
  run.sorted.forEach((job, index) => {
    const chip = document.createElement('span');
    const scheduled = run.slots.some((slot) => slot === job);
    const skipped = run.skipped.includes(job);
    chip.className = `chip${job === run.current && run.phase === 'decide' ? ' focus' : ''}${scheduled ? ' scheduled-chip' : ''}${skipped ? ' skipped-chip' : ''}`;
    chip.textContent = `${index + 1}. ${job.id} | `;
    const profit = document.createElement('b'); profit.className = 'profit'; profit.textContent = job.profit;
    chip.append(profit); container.append(chip);
  });
}

function renderSlots() {
  const container = $('slots'); container.className = 'slots'; container.replaceChildren();
  run.slots.forEach((job, index) => {
    const slot = document.createElement('div');
    slot.className = `slot${job ? ' filled' : ''}${index === run.lastSlot ? ' just-filled' : ''}`;
    const label = document.createElement('span'); label.className = 'slot-number'; label.textContent = `Slot ${index + 1}`;
    const value = document.createElement('strong'); value.textContent = job ? job.id : 'Open';
    slot.append(label, value); container.append(slot);
  });
}

function renderSkipped() {
  const container = $('skipped-jobs'); container.replaceChildren();
  if (!run.skipped.length) { container.className = 'skipped-list empty'; container.textContent = 'None'; return; }
  container.className = 'skipped-list';
  run.skipped.forEach((job) => { const chip = document.createElement('span'); chip.className = 'chip skipped-chip'; chip.textContent = `${job.id} · profit ${job.profit}`; container.append(chip); });
}

function showFinalResult() {
  const sequence = run.slots.filter(Boolean);
  $('result-sequence').replaceChildren();
  if (!sequence.length) $('result-sequence').textContent = 'No jobs could be scheduled';
  else sequence.forEach((job, index) => {
    if (index) { const arrow = document.createElement('span'); arrow.className = 'sequence-arrow'; arrow.textContent = '→'; $('result-sequence').append(arrow); }
    const name = document.createElement('span'); name.textContent = job.id; $('result-sequence').append(name);
  });
  $('final-profit').textContent = run.total;
  $('result-summary').textContent = `${sequence.length} job${sequence.length === 1 ? '' : 's'} scheduled across ${run.slots.length} available slot${run.slots.length === 1 ? '' : 's'}. ${run.skipped.length} skipped.`;
  $('message').textContent = `All jobs processed. Final profit: ${run.total}. Read the schedule from Slot 1 onward.`;
  $('step-count').textContent = `Complete · ${run.step} steps`;
  const check = $('example-check');
  if (isDefaultInput(run.jobs)) {
    const matches = sequence.map((job) => job.id).join(',') === 'J3,J1,J5' && run.total === 142 && run.skipped.map((job) => job.id).sort().join(',') === 'J2,J4';
    check.hidden = false; check.className = `example-check${matches ? '' : ' mismatch'}`;
    check.textContent = matches ? 'Example check: matches the expected sequence and profit.' : 'Example check: the result differs from the expected example. Review the slots and decisions.';
  }
  setFlow('result');
}

function isDefaultInput(jobs) { return JSON.stringify(jobs.map(({ id, deadline, profit }) => ({ id, deadline, profit }))) === JSON.stringify(DEFAULT_JOBS); }
const FLOW_ORDER = ['start', 'input', 'sort', 'select', 'deadline', 'check', 'schedule', 'skip', 'next', 'all', 'result', 'end'];
function setFlow(name) {
  clearFlow();
  const chosen = name === 'sort' ? ['input', 'sort'] : name === 'select' ? ['select', 'deadline'] : name === 'schedule' || name === 'skip' ? ['check', name, 'next', 'all'] : name === 'result' ? ['all', 'result'] : name === 'end' ? ['result', 'end'] : [name];
  chosen.forEach((key) => document.querySelector(`[data-flow="${key}"]`)?.classList.add(name === 'schedule' || name === 'skip' ? 'branch-active' : 'active'));
  if (name === 'schedule' || name === 'skip') document.querySelector('[data-flow="check"]')?.classList.add('complete');
  if (name === 'result') document.querySelector('[data-flow="all"]')?.classList.add('complete');
}
function clearFlow() { document.querySelectorAll('.flow-node').forEach((node) => node.classList.remove('active', 'complete', 'branch-active')); }
function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; $('auto').textContent = 'Auto run'; }

$('add-job').addEventListener('click', () => {
  const current = [...jobsBody.rows].map((row) => ({ id: row.querySelector('[data-field="id"]').value, deadline: row.querySelector('[data-field="deadline"]').value, profit: row.querySelector('[data-field="profit"]').value }));
  let number = 1;
  while (current.some((job) => job.id.trim().toLowerCase() === `j${number}`)) number++;
  const nextId = `J${number}`;
  current.push({ id: nextId, deadline: 1, profit: 10 }); renderInputJobs(current); invalidateRun();
});
$('start').addEventListener('click', startRun);
$('next').addEventListener('click', nextStep);
$('reset').addEventListener('click', () => { stopAuto(); renderInputJobs(DEFAULT_JOBS); $('input-error').hidden = true; invalidateRun(); $('step-count').textContent = 'Ready'; $('message').textContent = 'Press Start to prepare and sort the jobs.'; });
$('auto').addEventListener('click', () => {
  if (autoTimer) { stopAuto(); return; }
  $('auto').textContent = 'Pause';
  autoTimer = setInterval(() => { nextStep(); if (!run || run.phase === 'done') stopAuto(); }, 850);
});
renderInputJobs();
