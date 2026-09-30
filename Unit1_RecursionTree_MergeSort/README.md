# Merge Sort Visualizer

An interactive Design and Analysis of Algorithms project for exploring Merge Sort. Follow the recursive split tree, base cases, individual comparisons, placements, and completed merges.

## Run locally

Open `index.html` in a modern browser. No Java, dependencies, build tools, server, backend, or database are required.

## Use the visualizer

1. Enter 1 to 15 integers separated by spaces or commas.
2. Select **Start Visualization** to play the generated operation sequence, or use **Next** to step through it manually.
3. Use Previous, Play, Pause, Restart, or the speed selector to control playback. Click a tree node to jump to its operation.
4. Follow the left and right input lanes, selected comparison, merged output, explanation, and final result.

Negative values and duplicates are supported. Empty, invalid, and oversized inputs show a clear validation message. A single-element input is treated as a sorted base case.

## Files

- `index.html` - Page structure and project sections.
- `style.css` - Responsive layout, visual states, and animations.
- `script.js` - Merge Sort step engine, SVG tree, playback, and input validation.
- `README.md` - Project overview and run instructions.

## Algorithm notes

Merge Sort recursively divides an array until each subarray has one value, then merges sorted subarrays by comparing their first unplaced values. When values are equal, the left value is selected first, preserving stability.

| Case | Time |
| --- | --- |
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) |

Auxiliary space: O(n). The visualizer counts value-to-value comparisons during merging.
