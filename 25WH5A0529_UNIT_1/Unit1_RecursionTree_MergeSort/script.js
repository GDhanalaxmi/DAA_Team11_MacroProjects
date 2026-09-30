(() => {
  'use strict';

  const maximumValues = 15;
  const speedIntervals = { slow: 1450, normal: 850, fast: 360 };
  const elements = {
    input: document.querySelector('#arrayInput'),
    arraySize: document.querySelector('#arraySize'),
    inputMessage: document.querySelector('#inputMessage'),
    originalArray: document.querySelector('#originalArray'),
    arrayCount: document.querySelector('#arrayCount'),
    treeSvg: document.querySelector('#treeSvg'),
    treeViewport: document.querySelector('#treeViewport'),
    treeEmpty: document.querySelector('#treeEmpty'),
    treeDepth: document.querySelector('#treeDepth'),
    phaseBadge: document.querySelector('#phaseBadge'),
    stepCounter: document.querySelector('#stepCounter'),
    stepKicker: document.querySelector('#stepKicker'),
    stepTitle: document.querySelector('#stepTitle'),
    stepExplanation: document.querySelector('#stepExplanation'),
    operationLabel: document.querySelector('#operationLabel'),
    progressText: document.querySelector('#progressText'),
    progressTrack: document.querySelector('.progress-track[role="progressbar"]'),
    progressFill: document.querySelector('#progressFill'),
    finalResult: document.querySelector('#finalResult'),
    resultStatus: document.querySelector('#resultStatus'),
    comparisonCount: document.querySelector('#comparisonCount'),
    resultSize: document.querySelector('#resultSize'),
    mergeStepLabel: document.querySelector('#mergeStepLabel'),
    mergeIntro: document.querySelector('#mergeIntro'),
    leftValues: document.querySelector('#leftValues'),
    rightValues: document.querySelector('#rightValues'),
    mergedValues: document.querySelector('#mergedValues'),
    comparisonCallout: document.querySelector('#comparisonCallout'),
    visualize: document.querySelector('#visualizeButton'),
    random: document.querySelector('#randomButton'),
    reset: document.querySelector('#resetButton'),
    previous: document.querySelector('#previousButton'),
    next: document.querySelector('#nextButton'),
    play: document.querySelector('#playButton'),
    pause: document.querySelector('#pauseButton'),
    restart: document.querySelector('#restartButton')
  };

  let values = [];
  let root = null;
  let nodes = [];
  let steps = [];
  let cursor = -1;
  let timer = null;
  let speed = 'normal';
  let comparisons = 0;

  const svgElement = (name, attributes = {}) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  };

  function makeTree(array, start, depth, path) {
    const node = { values: array.slice(), start, end: start + array.length - 1, depth, id: path || 'root', left: null, right: null };
    nodes.push(node);
    if (array.length > 1) {
      const middle = Math.floor(array.length / 2);
      node.left = makeTree(array.slice(0, middle), start, depth + 1, `${path}L`);
      node.right = makeTree(array.slice(middle), start + middle, depth + 1, `${path}R`);
    }
    return node;
  }

  function createSteps(node) {
    steps.push({ type: 'start', phase: 'divide', nodeId: node.id });

    function divide(current) {
      if (!current.left) {
        steps.push({ type: 'base', phase: 'divide', nodeId: current.id, values: current.values.slice() });
        return;
      }
      steps.push({ type: 'split', phase: 'divide', nodeId: current.id, left: current.left.values.slice(), right: current.right.values.slice() });
      divide(current.left);
      divide(current.right);
    }

    divide(node);
    steps.push({ type: 'transition', phase: 'merge' });
    comparisons = 0;

    function merge(current) {
      if (!current.left) return current.values.slice();
      const left = merge(current.left);
      const right = merge(current.right);
      const result = [];
      let leftIndex = 0;
      let rightIndex = 0;
      steps.push({ type: 'merge-start', phase: 'merge', nodeId: current.id, left: left.slice(), right: right.slice(), result: [] });

      while (leftIndex < left.length && rightIndex < right.length) {
        const leftValue = left[leftIndex];
        const rightValue = right[rightIndex];
        const selectedSide = leftValue <= rightValue ? 'left' : 'right';
        const selectedValue = selectedSide === 'left' ? leftValue : rightValue;
        comparisons += 1;
        result.push(selectedValue);
        steps.push({
          type: 'compare', phase: 'merge', nodeId: current.id, left: left.slice(), right: right.slice(),
          leftIndex, rightIndex, selectedSide, selectedValue, result: result.slice(), comparisons,
          leftValue, rightValue
        });
        if (selectedSide === 'left') leftIndex += 1;
        else rightIndex += 1;
      }

      while (leftIndex < left.length) {
        const selectedValue = left[leftIndex++];
        result.push(selectedValue);
        steps.push({ type: 'append', phase: 'merge', nodeId: current.id, left: left.slice(), right: right.slice(), side: 'left', selectedValue, result: result.slice(), comparisons });
      }
      while (rightIndex < right.length) {
        const selectedValue = right[rightIndex++];
        result.push(selectedValue);
        steps.push({ type: 'append', phase: 'merge', nodeId: current.id, left: left.slice(), right: right.slice(), side: 'right', selectedValue, result: result.slice(), comparisons });
      }

      steps.push({ type: 'merge-complete', phase: 'merge', nodeId: current.id, left: left.slice(), right: right.slice(), result: result.slice(), comparisons });
      return result;
    }

    const sorted = merge(node);
    steps.push({ type: 'complete', phase: 'complete', nodeId: node.id, result: sorted.slice(), comparisons });
  }

  function analyzeInput(inputValues) {
    const duplicate = new Set(inputValues).size !== inputValues.length;
    const alreadySorted = inputValues.every((value, index) => index === 0 || inputValues[index - 1] <= value);
    const reverseSorted = inputValues.every((value, index) => index === 0 || inputValues[index - 1] >= value);
    if (alreadySorted && inputValues.length > 1) return 'This array is already sorted. Run it to see how Merge Sort still divides and merges it.';
    if (reverseSorted && inputValues.length > 1) return 'This array is reverse sorted. Merge Sort handles it in O(n log n) time.';
    if (duplicate) return 'Duplicates are allowed. Equal values keep their original order during merging.';
    if (inputValues.some((value) => value < 0)) return 'Negative integers are supported and sort in numeric order.';
    return `${inputValues.length} value${inputValues.length === 1 ? '' : 's'} ready. Start to step through the algorithm.`;
  }

  function parseInput() {
    const raw = elements.input.value.trim();
    elements.inputMessage.className = 'input-message';
    if (!raw) throw new Error('Enter at least one integer to visualize.');
    const tokens = raw.split(/[\s,]+/).filter(Boolean);
    if (tokens.length > maximumValues) throw new Error(`You entered ${tokens.length} values. Use 15 or fewer for a readable tree.`);
    const parsed = tokens.map((token) => {
      if (!/^-?\d+$/.test(token)) throw new Error(`"${token}" is not an integer. Use spaces or commas between whole numbers.`);
      const number = Number(token);
      if (!Number.isSafeInteger(number)) throw new Error('Use integers within the JavaScript safe integer range.');
      return number;
    });
    return parsed;
  }

  function buildVisualization(inputValues) {
    stopPlayback();
    values = inputValues.slice();
    nodes = [];
    steps = [];
    comparisons = 0;
    cursor = -1;
    root = makeTree(values, 0, 0, '');
    createSteps(root);
    elements.arraySize.value = String(values.length);
    elements.inputMessage.textContent = analyzeInput(values);
    elements.inputMessage.className = 'input-message';
    render();
  }

  function reportInputError(message) {
    elements.inputMessage.textContent = message;
    elements.inputMessage.className = 'input-message error';
    elements.input.focus();
  }

  function visualize() {
    try {
      buildVisualization(parseInput());
      cursor = 0;
      render();
      if (steps.length > 1) startPlayback();
    } catch (error) {
      reportInputError(error.message);
    }
  }

  function getLayout() {
    const width = Math.max(320, Math.floor(elements.treeViewport.clientWidth - 18));
    const top = 32;
    const levelGap = 98;
    const height = top + Math.max(0, ...nodes.map((node) => node.depth)) * levelGap + 54;
    const leafPitch = (width - 28) / Math.max(1, values.length);
    const positions = new Map();

    function position(node) {
      if (!node.left) {
        const x = 14 + (node.start + .5) * leafPitch;
        const layout = { x, y: top + node.depth * levelGap, width: Math.max(24, Math.min(leafPitch - 3, 42)), height: 30 };
        positions.set(node.id, layout);
        return layout;
      }
      const left = position(node.left);
      const right = position(node.right);
      const span = node.end - node.start + 1;
      const nodeWidth = Math.max(62, Math.min(width - 18, span * leafPitch - 5, 330));
      const layout = { x: (left.x + right.x) / 2, y: top + node.depth * levelGap, width: nodeWidth, height: 34 };
      positions.set(node.id, layout);
      return layout;
    }

    if (root) position(root);
    return { width, height, positions };
  }

  function formatNodeValues(array, availableWidth) {
    const full = `[${array.join(', ')}]`;
    const maxCharacters = Math.max(4, Math.floor((availableWidth - 12) / 5.9));
    if (full.length <= maxCharacters) return full;
    if (array.length <= 2) return full;
    return `[${array[0]}, ..., ${array[array.length - 1]}]`;
  }

  function renderTree() {
    const svg = elements.treeSvg;
    svg.replaceChildren();
    if (!root) {
      elements.treeEmpty.classList.add('visible');
      svg.removeAttribute('viewBox');
      svg.removeAttribute('height');
      elements.treeDepth.textContent = 'Recursion depth: --';
      return;
    }

    elements.treeEmpty.classList.remove('visible');
    const { width, height, positions } = getLayout();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('height', height);
    const statuses = new Map(nodes.map((node) => [node.id, 'pending']));
    const sortedValues = new Map();
    let activeNodeId = null;
    for (let index = 0; index <= cursor; index += 1) {
      const operation = steps[index];
      if (operation.nodeId) activeNodeId = operation.nodeId;
      if (operation.type === 'split') statuses.set(operation.nodeId, 'split');
      if (operation.type === 'base') { statuses.set(operation.nodeId, 'done'); sortedValues.set(operation.nodeId, operation.values); }
      if (operation.type === 'merge-start' || operation.type === 'compare' || operation.type === 'append') statuses.set(operation.nodeId, 'active');
      if (operation.type === 'merge-complete') { statuses.set(operation.nodeId, 'done'); sortedValues.set(operation.nodeId, operation.result); }
    }
    const current = steps[cursor];
    if (!current || current.type === 'start' || current.type === 'transition') activeNodeId = null;
    const edgeLayer = svgElement('g', { class: 'tree-edges' });
    const nodeLayer = svgElement('g', { class: 'tree-nodes' });

    for (const node of nodes) {
      if (!node.left) continue;
      const parent = positions.get(node.id);
      for (const child of [node.left, node.right]) {
        const childPosition = positions.get(child.id);
        const startY = parent.y + parent.height / 2;
        const endY = childPosition.y - childPosition.height / 2;
        const path = svgElement('path', {
          d: `M ${parent.x} ${startY} C ${parent.x} ${startY + 22}, ${childPosition.x} ${endY - 22}, ${childPosition.x} ${endY}`,
          class: `tree-edge ${activeNodeId === node.id ? 'edge-active' : statuses.get(node.id) === 'done' ? 'edge-complete' : ''}`
        });
        edgeLayer.append(path);
      }
    }

    for (const node of nodes) {
      const point = positions.get(node.id);
      const status = activeNodeId === node.id ? 'status-active' : `status-${statuses.get(node.id)}`;
      const group = svgElement('g', { class: `tree-node ${status}`, tabindex: '0', role: 'button', 'aria-label': `Array ${node.values.join(', ')}. ${node.left ? 'Click to jump to this split or merge.' : 'Single element base case.'}` });
      const title = svgElement('title');
      title.textContent = `[${node.values.join(', ')}]`;
      group.append(title);
      const rect = svgElement('rect', {
        x: point.x - point.width / 2, y: point.y - point.height / 2,
        width: point.width, height: point.height, rx: 5
      });
      group.append(rect);
      const displayedValues = sortedValues.get(node.id) ?? node.values;
      const label = svgElement('text', { x: point.x, y: point.y - 3 });
      label.textContent = formatNodeValues(displayedValues, point.width);
      group.append(label);
      const phase = svgElement('text', { x: point.x, y: point.y + 10, class: 'node-phase' });
      phase.textContent = node.left ? `LEVEL ${node.depth}` : 'BASE CASE';
      group.append(phase);
      const target = node.left ? steps.findIndex((operation) => operation.nodeId === node.id && operation.type === 'split') : steps.findIndex((operation) => operation.nodeId === node.id && operation.type === 'base');
      group.addEventListener('click', () => jumpToNode(node, target));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); jumpToNode(node, target); }
      });
      nodeLayer.append(group);
    }

    svg.append(edgeLayer, nodeLayer);
    elements.treeDepth.textContent = `Recursion depth: ${Math.max(...nodes.map((node) => node.depth))}`;
  }

  function jumpToNode(node, splitTarget) {
    if (!steps.length) return;
    let target = splitTarget;
    if (cursor > splitTarget && node.left) {
      const mergeTarget = steps.findIndex((operation) => operation.nodeId === node.id && operation.type === 'merge-start');
      if (mergeTarget >= 0) target = mergeTarget;
    }
    if (target >= 0) goTo(target);
  }

  function renderOriginal() {
    elements.originalArray.replaceChildren();
    if (!values.length) {
      const empty = document.createElement('span');
      empty.className = 'array-empty';
      empty.textContent = 'Your values will appear here.';
      elements.originalArray.append(empty);
      elements.arrayCount.textContent = 'No elements';
      elements.resultSize.textContent = '0';
      return;
    }
    values.forEach((value, index) => {
      const cell = document.createElement('span');
      cell.className = 'array-cell';
      cell.style.animationDelay = `${Math.min(index * 25, 250)}ms`;
      cell.textContent = String(value);
      elements.originalArray.append(cell);
    });
    elements.arrayCount.textContent = `${values.length} element${values.length === 1 ? '' : 's'}`;
    elements.resultSize.textContent = String(values.length);
  }

  function appendLaneValues(container, laneValues, pointerIndex = -1, chosenIndex = -1, placeholder = 'Waiting') {
    container.replaceChildren();
    if (!laneValues || laneValues.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'lane-placeholder';
      empty.textContent = placeholder;
      container.append(empty);
      return;
    }
    laneValues.forEach((value, index) => {
      const item = document.createElement('span');
      item.className = `lane-value ${index === pointerIndex ? 'pointer' : ''} ${index === chosenIndex ? 'chosen' : ''}`;
      item.textContent = String(value);
      if (index === pointerIndex) item.setAttribute('aria-label', `${value}, current comparison`);
      container.append(item);
    });
  }

  function renderMerge(operation) {
    const mergeOperation = operation && ['merge-start', 'compare', 'append', 'merge-complete'].includes(operation.type) ? operation : null;
    if (!mergeOperation) {
      appendLaneValues(elements.leftValues, [], -1, -1, 'Waiting');
      appendLaneValues(elements.rightValues, [], -1, -1, 'Waiting');
      appendLaneValues(elements.mergedValues, [], -1, -1, 'Empty');
      elements.mergeStepLabel.textContent = operation?.phase === 'divide' ? 'Split phase' : 'Waiting for merge phase';
      elements.mergeIntro.textContent = operation?.type === 'transition'
        ? 'Now we merge. Each single value is sorted; combine neighboring arrays while keeping them in order.'
        : 'When every branch reaches one value, the sorted pieces return upward and combine.';
      const isTransition = operation?.type === 'transition';
      elements.comparisonCallout.dataset.kind = isTransition ? 'place' : '';
      elements.comparisonCallout.querySelector('span:last-child').textContent = isTransition
        ? 'The split phase is complete. Advance to compare the first pair of sorted subarrays.'
        : 'Choose Next Step or Play to begin.';
      return;
    }

    const isCompare = mergeOperation.type === 'compare';
    const isAppend = mergeOperation.type === 'append';
    const leftPointer = isCompare ? mergeOperation.leftIndex : -1;
    const rightPointer = isCompare ? mergeOperation.rightIndex : -1;
    const leftChosen = isCompare && mergeOperation.selectedSide === 'left' ? leftPointer : isAppend && mergeOperation.side === 'left' ? mergeOperation.result.length - 1 : -1;
    const rightChosen = isCompare && mergeOperation.selectedSide === 'right' ? rightPointer : isAppend && mergeOperation.side === 'right' ? mergeOperation.result.length - 1 : -1;
    appendLaneValues(elements.leftValues, mergeOperation.left, leftPointer, leftChosen);
    appendLaneValues(elements.rightValues, mergeOperation.right, rightPointer, rightChosen);
    appendLaneValues(elements.mergedValues, mergeOperation.result, -1, mergeOperation.result.length - 1, 'Empty');
    elements.mergeStepLabel.textContent = `Merge ${mergeOperation.nodeId} / ${mergeOperation.result.length} placed`;
    elements.mergeIntro.textContent = 'Compare the first unused values. Place the smaller one into the result; copy any values that remain.';

    let message = 'Sorted subarrays are ready to combine.';
    let kind = '';
    let mark = '?';
    if (isCompare) {
      const symbol = mergeOperation.leftValue === mergeOperation.rightValue ? '=' : mergeOperation.selectedValue === mergeOperation.leftValue ? '<' : '>';
      message = `${mergeOperation.leftValue} ${symbol} ${mergeOperation.rightValue} - place ${mergeOperation.selectedValue} from the ${mergeOperation.selectedSide} array.`;
      kind = 'compare';
      mark = '<>';
    } else if (isAppend) {
      message = `The ${mergeOperation.side} array has values remaining. Copy ${mergeOperation.selectedValue} into the merged array.`;
      kind = 'place';
      mark = 'OK';
    } else if (mergeOperation.type === 'merge-complete') {
      message = `Merge complete: [${mergeOperation.result.join(', ')}].`;
      kind = 'complete';
      mark = 'OK';
    } else {
      message = 'Prepare these sorted halves for comparison.';
    }
    elements.comparisonCallout.dataset.kind = kind;
    elements.comparisonCallout.querySelector('.callout-mark').textContent = mark;
    elements.comparisonCallout.querySelector('span:last-child').textContent = message;
  }

  function setExplanation(operation, displayStep) {
    const labels = {
      start: () => ['START', 'Start', 'We begin with the original array and keep its order as the reference for stability.'],
      split: () => {
        const node = nodes.find((item) => item.id === operation.nodeId);
        return ['DIVIDE', 'Divide', `Split [${node.values.join(', ')}] into [${operation.left.join(', ')}] and [${operation.right.join(', ')}].`];
      },
      base: () => ['BASE CASE', 'Base case', `[${operation.values.join(', ')}] contains one value, so it is already sorted.`],
      transition: () => ['CONQUER', 'Now we merge', 'Every branch has reached one value. Combine the sorted pieces from the leaves back toward the root.'],
      'merge-start': () => ['MERGE', 'Prepare to merge', `Compare the sorted halves [${operation.left.join(', ')}] and [${operation.right.join(', ')}].`],
      compare: () => ['COMPARE & SELECT', 'Compare and place', `Compare ${operation.leftValue} with ${operation.rightValue}. Place ${operation.selectedValue}, the smaller available value, into the result.`],
      append: () => ['COPY REMAINDER', 'Copy remaining value', `The other half has no unplaced values. Copy ${operation.selectedValue} from the ${operation.side} array.`],
      'merge-complete': () => ['MERGE COMPLETE', 'The halves are combined', `[${operation.left.join(', ')}] and [${operation.right.join(', ')}] are now [${operation.result.join(', ')}].`],
      complete: () => ['SORT COMPLETE', 'Array sorted', `Merge Sort produced [${operation.result.join(', ')}] in ${operation.comparisons} comparisons.`]
    };
    const [kicker, title, explanation] = (labels[operation.type] ?? labels.start)();
    elements.stepKicker.textContent = `STEP ${displayStep} / ${steps.length} - ${kicker}`;
    elements.stepTitle.textContent = title;
    elements.stepExplanation.textContent = explanation;
    elements.stepCounter.textContent = `${displayStep} / ${steps.length}`;
    elements.operationLabel.textContent = operation.type.replace('-', ' ').toUpperCase();
  }

  function renderResult(operation) {
    const complete = operation?.type === 'complete';
    elements.finalResult.replaceChildren();
    if (!complete) {
      const placeholder = document.createElement('span');
      placeholder.className = 'result-placeholder';
      placeholder.textContent = 'The sorted array will appear here.';
      elements.finalResult.append(placeholder);
      elements.resultStatus.textContent = cursor < 0 ? 'READY' : 'IN PROGRESS';
      elements.resultStatus.classList.remove('complete');
      elements.comparisonCount.textContent = String(operation?.comparisons ?? 0);
      return;
    }
    operation.result.forEach((value, index) => {
      const chip = document.createElement('span');
      chip.className = 'result-chip';
      chip.style.animationDelay = `${Math.min(index * 30, 300)}ms`;
      chip.textContent = String(value);
      elements.finalResult.append(chip);
    });
    elements.resultStatus.textContent = 'SORTED';
    elements.resultStatus.classList.add('complete');
    elements.comparisonCount.textContent = String(operation.comparisons);
  }

  function render() {
    renderOriginal();
    renderTree();
    const operation = steps[cursor] ?? null;
    const displayStep = cursor + 1;
    if (operation) {
      setExplanation(operation, displayStep);
      elements.phaseBadge.textContent = operation.phase === 'complete' ? 'COMPLETE' : operation.phase.toUpperCase();
      elements.phaseBadge.dataset.phase = operation.phase;
      renderMerge(operation);
    } else {
      elements.stepKicker.textContent = 'START WHEN READY';
      elements.stepTitle.textContent = values.length ? 'Your algorithm, one step at a time.' : 'Enter an array to begin.';
      elements.stepExplanation.textContent = values.length ? 'Start the visualization to follow each split, comparison, and placement using your input.' : 'Enter whole numbers separated by spaces or commas. You can use negative and duplicate values.';
      elements.stepCounter.textContent = 'READY';
      elements.operationLabel.textContent = '--';
      elements.phaseBadge.textContent = values.length ? 'READY' : 'WAITING';
      elements.phaseBadge.dataset.phase = 'ready';
      renderMerge(null);
      elements.comparisonCount.textContent = '0';
      elements.resultStatus.textContent = values.length ? 'IN PROGRESS' : 'READY';
      elements.resultStatus.classList.remove('complete');
    }
    renderResult(operation);
    const completed = cursor < 0 ? 0 : cursor + 1;
    elements.progressText.textContent = `${completed} / ${steps.length}`;
    const percent = steps.length ? completed / steps.length * 100 : 0;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    elements.previous.disabled = cursor <= 0;
    elements.next.disabled = !steps.length || cursor >= steps.length - 1;
    elements.play.disabled = !steps.length || timer !== null;
    elements.pause.disabled = timer === null;
    elements.restart.disabled = !steps.length;
    elements.visualize.disabled = timer !== null;
  }

  function goTo(index) {
    if (!steps.length) return;
    cursor = Math.max(0, Math.min(steps.length - 1, index));
    render();
    if (cursor === steps.length - 1) stopPlayback();
  }

  function stopPlayback() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    if (elements.pause) elements.pause.disabled = true;
    if (elements.play) elements.play.disabled = !steps.length || cursor >= steps.length - 1;
    if (elements.visualize) elements.visualize.disabled = false;
  }

  function startPlayback() {
    if (!steps.length || timer !== null) return;
    if (cursor >= steps.length - 1) cursor = -1;
    if (cursor < 0) cursor = 0;
    render();
    if (cursor >= steps.length - 1) return;
    timer = window.setInterval(() => goTo(cursor + 1), speedIntervals[speed]);
    render();
  }

  function resetVisualization() {
    stopPlayback();
    elements.input.value = '';
    elements.arraySize.value = '7';
    values = [];
    nodes = [];
    steps = [];
    root = null;
    cursor = -1;
    elements.inputMessage.textContent = 'Use spaces or commas between numbers.';
    elements.inputMessage.className = 'input-message';
    render();
  }

  elements.visualize.addEventListener('click', visualize);
  elements.random.addEventListener('click', () => {
    const size = Math.max(1, Math.min(maximumValues, Number(elements.arraySize.value) || 7));
    elements.arraySize.value = String(size);
    const generated = Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
    elements.input.value = generated.join(' ');
    buildVisualization(generated);
  });
  elements.reset.addEventListener('click', resetVisualization);
  elements.previous.addEventListener('click', () => goTo(cursor - 1));
  elements.next.addEventListener('click', () => goTo(cursor + 1));
  elements.play.addEventListener('click', startPlayback);
  elements.pause.addEventListener('click', () => { stopPlayback(); render(); });
  elements.restart.addEventListener('click', () => { stopPlayback(); cursor = -1; render(); });
  elements.input.addEventListener('input', () => {
    elements.inputMessage.textContent = 'Press Start Visualization when your array is ready.';
    elements.inputMessage.className = 'input-message';
  });
  elements.input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') visualize();
  });
  elements.treeViewport.addEventListener('resize', () => renderTree());
  window.addEventListener('resize', renderTree);
  document.querySelectorAll('[data-speed]').forEach((button) => {
    button.addEventListener('click', () => {
      speed = button.dataset.speed;
      document.querySelectorAll('[data-speed]').forEach((option) => {
        const selected = option === button;
        option.classList.toggle('selected', selected);
        option.setAttribute('aria-pressed', String(selected));
      });
      if (timer !== null) {
        stopPlayback();
        startPlayback();
      }
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, button, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' && cursor < steps.length - 1) { event.preventDefault(); goTo(cursor + 1); }
    else if (event.key === 'ArrowLeft' && cursor > 0) { event.preventDefault(); goTo(cursor - 1); }
    else if (event.key === 'Home' && steps.length) { event.preventDefault(); elements.restart.click(); }
    else if (event.code === 'Space' && steps.length) { event.preventDefault(); timer === null ? startPlayback() : elements.pause.click(); }
  });

  try {
    buildVisualization(parseInput());
  } catch (error) {
    elements.inputMessage.textContent = error.message;
    elements.inputMessage.className = 'input-message';
  }
})();