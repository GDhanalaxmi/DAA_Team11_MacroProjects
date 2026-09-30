const vertices = ["A", "B", "C", "D"];

const colors = [
    {
        name: "Red",
        value: "#ef4444"
    },
    {
        name: "Green",
        value: "#22c55e"
    },
    {
        name: "Blue",
        value: "#3b82f6"
    }
];

const demoEdges = [
    ["A", "B"],
    ["A", "C"],
    ["A", "D"],
    ["B", "C"],
    ["B", "D"],
    ["C", "D"]
];

let edges = [];

let steps = [];

let currentStep = 0;

let backtracks = 0;

let assignments = 0;

let simulationRunning = false;

let playing = false;

let playTimer = null;

let finalSolution = null;


/* =========================
   BASIC GRAPH FUNCTIONS
========================= */

function edgeExists(a, b) {

    return edges.some(function(edge) {

        return (
            (edge[0] === a && edge[1] === b) ||
            (edge[0] === b && edge[1] === a)
        );

    });
}


function getNeighbors(vertex) {

    const neighbors = [];

    edges.forEach(function(edge) {

        if (edge[0] === vertex) {

            neighbors.push(edge[1]);

        } else if (edge[1] === vertex) {

            neighbors.push(edge[0]);

        }

    });

    return neighbors;
}


/* =========================
   EDGE CONTROLS
========================= */

function addEdge() {

    if (simulationRunning) {

        alert("Reset the simulation before changing edges.");

        return;
    }

    const a =
        document.getElementById("addFrom").value;

    const b =
        document.getElementById("addTo").value;

    if (a === b) {

        alert("A vertex cannot connect to itself.");

        return;
    }

    if (edgeExists(a, b)) {

        alert("This edge already exists.");

        return;
    }

    edges.push([a, b]);

    resetSimulation();

    updateAdjacency();

    drawGraph();
}


function removeEdge() {

    if (simulationRunning) {

        alert("Reset the simulation before changing edges.");

        return;
    }

    const a =
        document.getElementById("removeFrom").value;

    const b =
        document.getElementById("removeTo").value;

    const oldLength =
        edges.length;

    edges = edges.filter(function(edge) {

        return !(
            (edge[0] === a && edge[1] === b) ||
            (edge[0] === b && edge[1] === a)
        );

    });

    if (edges.length === oldLength) {

        alert("That edge does not exist.");

        return;
    }

    resetSimulation();

    updateAdjacency();

    drawGraph();
}


function clearEdges() {

    if (simulationRunning) {

        alert("Reset the simulation before changing edges.");

        return;
    }

    edges = [];

    resetSimulation();

    updateAdjacency();

    drawGraph();
}


function generateRandomGraph() {

    if (simulationRunning) {

        alert(
            "Reset the simulation before generating a new graph."
        );

        return;
    }

    const possibleEdges = [
        ["A", "B"],
        ["A", "C"],
        ["A", "D"],
        ["B", "C"],
        ["B", "D"],
        ["C", "D"]
    ];

    edges = [];

    possibleEdges.forEach(function(edge) {

        if (Math.random() < 0.5) {

            edges.push(edge);

        }

    });

    resetSimulation();

    updateAdjacency();

    drawGraph();

    setStatus(
        "Status: Random graph generated",
        "status"
    );
}


function generateBacktrackingDemo() {

    if (simulationRunning) {

        alert(
            "Reset the simulation before generating a new graph."
        );

        return;
    }

    edges = demoEdges.map(function(edge) {

        return [...edge];

    });

    resetSimulation();

    updateAdjacency();

    drawGraph();

    setStatus(
        "Status: Backtracking demonstration graph ready",
        "status"
    );
}


/* =========================
   COLOR CHECKING
========================= */

function isSafe(
    vertex,
    colorIndex,
    assignment
) {

    const neighbors =
        getNeighbors(vertex);

    for (let i = 0; i < neighbors.length; i++) {

        const neighbor =
            neighbors[i];

        if (
            assignment[neighbor] !== null &&
            assignment[neighbor] === colorIndex
        ) {

            return false;
        }
    }

    return true;
}


/* =========================
   GENERATE BACKTRACKING TRACE
========================= */

function generateTrace() {

    const assignment = {
        A: null,
        B: null,
        C: null,
        D: null
    };

    const trace = [];

    let solution = null;

    function solve(index) {

        if (index === vertices.length) {

            solution = {
                ...assignment
            };

            trace.push({

                type: "success",

                message:
                    "All 4 vertices are successfully colored."

            });

            return true;
        }

        const vertex =
            vertices[index];

        for (
            let colorIndex = 0;
            colorIndex < colors.length;
            colorIndex++
        ) {

            const color =
                colors[colorIndex];

            trace.push({

                type: "try",

                vertex: vertex,

                color: color.name,

                colorIndex: colorIndex,

                message:
                    "Trying " +
                    color.name +
                    " for vertex " +
                    vertex

            });

            if (
                isSafe(
                    vertex,
                    colorIndex,
                    assignment
                )
            ) {

                assignment[vertex] =
                    colorIndex;

                trace.push({

                    type: "assign",

                    vertex: vertex,

                    color: color.name,

                    colorIndex: colorIndex,

                    message:
                        "Assigned " +
                        color.name +
                        " to vertex " +
                        vertex

                });

                if (
                    solve(index + 1)
                ) {

                    return true;
                }

                /*
                 * REAL BACKTRACK
                 *
                 * This step is generated only when
                 * the recursive search fails.
                 */

                trace.push({

                    type: "backtrack",

                    vertex: vertex,

                    color: color.name,

                    colorIndex: colorIndex,

                    message:
                        "Backtracking from vertex " +
                        vertex +
                        " and removing " +
                        color.name

                });

                assignment[vertex] = null;

            } else {

                trace.push({

                    type: "conflict",

                    vertex: vertex,

                    color: color.name,

                    colorIndex: colorIndex,

                    message:
                        "Conflict! Vertex " +
                        vertex +
                        " cannot use " +
                        color.name

                });
            }
        }

        return false;
    }

    const found =
        solve(0);

    if (!found) {

        trace.push({

            type: "failure",

            message:
                "No valid 3-coloring exists for this graph."

        });
    }

    return {
        trace: trace,
        solution: solution,
        found: found
    };
}


/* =========================
   START SIMULATION
========================= */

function startSimulation() {

    if (edges.length === 0) {

        alert(
            "Add at least one edge or generate a graph."
        );

        return;
    }

    stopPlaying();

    const result =
        generateTrace();

    steps =
        result.trace;

    finalSolution =
        result.solution;

    currentStep = 0;

    backtracks = 0;

    assignments = 0;

    simulationRunning = true;

    resetVertices();

    clearEdgesHighlight();

    clearStepPanel();

    document.getElementById("startBtn")
        .disabled = true;

    document.getElementById("nextBtn")
        .disabled = false;

    document.getElementById("playBtn")
        .disabled = false;

    document.getElementById("solution")
        .style.display = "none";

    setStatus(
        "Status: Simulation started",
        "status"
    );

    updateCounters();

    updateProgress();
}


/* =========================
   NEXT STEP
========================= */

function nextStep() {

    if (!simulationRunning) {

        return;
    }

    if (currentStep >= steps.length) {

        finishSimulation();

        return;
    }

    const step =
        steps[currentStep];

    currentStep++;

    /*
     * Add step to log first.
     */
    addStep(step);


    /* =========================
       TRY
    ========================= */

    if (step.type === "try") {

        activateVertex(
            step.vertex,
            step.color
        );

        highlightTryingEdges(
            step.vertex,
            step.color
        );

        setStatus(
            "Status: Trying " +
            step.color +
            " for vertex " +
            step.vertex,
            "warning-status"
        );
    }


    /* =========================
       CONFLICT
    ========================= */

    else if (step.type === "conflict") {

        showConflict(
            step.vertex
        );

        highlightConflictEdges(
            step.vertex,
            step.colorIndex
        );

        setStatus(
            "Status: Conflict! " +
            step.vertex +
            " cannot use " +
            step.color,
            "error-status"
        );
    }


    /* =========================
       ASSIGN
    ========================= */

    else if (step.type === "assign") {

        assignments++;

        colorVertex(
            step.vertex,
            step.color
        );

        highlightAssignedEdges(
            step.vertex
        );

        setStatus(
            "Status: " +
            step.vertex +
            " = " +
            step.color,
            "status"
        );
    }


    /* =========================
       BACKTRACK
    ========================= */

    else if (step.type === "backtrack") {
         
        /*
         * THIS IS THE IMPORTANT FIX.
         *
         * Every generated backtrack step increments
         * the counter exactly once.
         */

        backtracks++;

        updateBacktrackCounter();

        resetVertex(
            step.vertex
        );

        highlightBacktrackEdges(
            step.vertex
        );

        setStatus(
            "Status: Backtracking from " +
            step.vertex +
            " | Backtracks: " +
            backtracks,
            "warning-status"
        );
    }


    /* =========================
       SUCCESS
    ========================= */

    else if (step.type === "success") {

        setStatus(
            "Status: Valid coloring found ✓",
            "success-status"
        );

        highlightAllAssignedEdges();
    }


    /* =========================
       FAILURE
    ========================= */

    else if (step.type === "failure") {

        setStatus(
            "Status: No valid 3-coloring exists",
            "error-status"
        );
    }


    updateCounters();

    updateProgress();


    if (currentStep >= steps.length) {

        finishSimulation();
    }
}


/* =========================
   PLAY
========================= */

function playSimulation() {

    if (!simulationRunning) {

        return;
    }

    if (playing) {

        return;
    }

    if (currentStep >= steps.length) {

        return;
    }

    playing = true;

    document.getElementById("playBtn")
        .disabled = true;

    playTimer =
        setInterval(function() {

            if (
                currentStep >= steps.length ||
                !simulationRunning
            ) {

                stopPlaying();

                return;
            }

            nextStep();

        }, 900);
}


function stopPlaying() {

    playing = false;

    if (playTimer !== null) {

        clearInterval(playTimer);

        playTimer = null;
    }

    const playButton =
        document.getElementById("playBtn");

    if (
        playButton &&
        simulationRunning &&
        currentStep < steps.length
    ) {

        playButton.disabled = false;
    }
}


/* =========================
   FINISH
========================= */

function finishSimulation() {

    stopPlaying();

    simulationRunning = false;

    document.getElementById("nextBtn")
        .disabled = true;

    document.getElementById("startBtn")
        .disabled = false;

    document.getElementById("playBtn")
        .disabled = true;

    updateCounters();

    updateProgress();


    if (finalSolution) {

        const solution =
            document.getElementById("solution");

        solution.style.display = "block";

        solution.className =
            "solution";

        solution.innerHTML =
            "✓ Valid 3-coloring found! " +
            "Backtracks: " +
            backtracks;

        setStatus(
            "Status: Solution Found ✓",
            "success-status"
        );

    } else {

        const solution =
            document.getElementById("solution");

        solution.style.display = "block";

        solution.className =
            "solution no-solution";

        solution.innerHTML =
            "✗ No valid 3-coloring exists. " +
            "Backtracks: " +
            backtracks;

        setStatus(
            "Status: No Solution | Backtracks: " +
            backtracks,
            "error-status"
        );
    }
}


/* =========================
   VERTEX FUNCTIONS
========================= */

function colorVertex(
    vertex,
    colorName
) {

    const element =
        document.getElementById(vertex);

    if (!element) {

        return;
    }

    const color =
        colors.find(function(item) {

            return item.name === colorName;

        });

    if (color) {

        element.style.background =
            color.value;
    }

    element.classList.remove(
        "conflict"
    );

    element.classList.remove(
        "backtrack"
    );
}


function resetVertex(vertex) {

    const element =
        document.getElementById(vertex);

    if (!element) {

        return;
    }

    element.style.background =
        "#94a3b8";

    element.classList.remove(
        "active",
        "conflict",
        "backtrack"
    );
}


function resetVertices() {

    vertices.forEach(function(vertex) {

        resetVertex(vertex);

    });
}


function activateVertex(
    vertex,
    colorName
) {

    clearActiveVertices();

    const element =
        document.getElementById(vertex);

    if (!element) {

        return;
    }

    element.classList.add(
        "active"
    );

    const color =
        colors.find(function(item) {

            return item.name === colorName;

        });

    if (color) {

        element.style.background =
            color.value;
    }
}


function clearActiveVertices() {

    vertices.forEach(function(vertex) {

        const element =
            document.getElementById(vertex);

        if (element) {

            element.classList.remove(
                "active"
            );
        }

    });
}


function showConflict(vertex) {

    clearActiveVertices();

    const element =
        document.getElementById(vertex);

    if (!element) {

        return;
    }

    element.classList.add(
        "conflict",
        "active"
    );
}


/* =========================
   EDGE HIGHLIGHTING
========================= */

function getEdgeElement(a, b) {

    const allEdges =
        document.querySelectorAll(
            ".edge"
        );

    for (
        let i = 0;
        i < allEdges.length;
        i++
    ) {

        const edge =
            allEdges[i];

        const edgeIndex =
            parseInt(
                edge.dataset.edge,
                10
            );

        const graphEdge =
            edges[edgeIndex];

        if (!graphEdge) {

            continue;
        }

        if (
            (
                graphEdge[0] === a &&
                graphEdge[1] === b
            ) ||
            (
                graphEdge[0] === b &&
                graphEdge[1] === a
            )
        ) {

            return edge;
        }
    }

    return null;
}


function clearEdgesHighlight() {

    document.querySelectorAll(
        ".edge"
    ).forEach(function(edge) {

        edge.classList.remove(
            "try",
            "assigned",
            "conflict",
            "backtrack"
        );

        edge.style.stroke =
            "#64748b";

        edge.style.strokeWidth =
            "4";
    });
}


function highlightTryingEdges(
    vertex,
    colorName
) {

    const color =
        colors.find(function(item) {

            return item.name === colorName;

        });

    if (!color) {

        return;
    }

    edges.forEach(function(edge) {

        if (
            edge[0] === vertex ||
            edge[1] === vertex
        ) {

            const element =
                getEdgeElement(
                    edge[0],
                    edge[1]
                );

            if (!element) {

                return;
            }

            element.classList.remove(
                "conflict",
                "backtrack",
                "assigned"
            );

            element.classList.add(
                "try"
            );

            element.style.stroke =
                color.value;

            element.style.strokeWidth =
                "8";
        }
    });
}


function highlightConflictEdges(
    vertex,
    colorIndex
) {

    const neighbors =
        getNeighbors(vertex);

    neighbors.forEach(function(neighbor) {

        const element =
            getEdgeElement(
                vertex,
                neighbor
            );

        if (!element) {

            return;
        }

        element.classList.remove(
            "try",
            "assigned",
            "backtrack"
        );

        element.classList.add(
            "conflict"
        );

        element.style.stroke =
            "#ef4444";

        element.style.strokeWidth =
            "9";
    });
}


function highlightBacktrackEdges(
    vertex
) {

    edges.forEach(function(edge) {

        if (
            edge[0] === vertex ||
            edge[1] === vertex
        ) {

            const element =
                getEdgeElement(
                    edge[0],
                    edge[1]
                );

            if (!element) {

                return;
            }

            element.classList.remove(
                "try",
                "assigned",
                "conflict"
            );

            element.classList.add(
                "backtrack"
            );

            element.style.stroke =
                "#f59e0b";

            element.style.strokeWidth =
                "9";
        }
    });

    const vertexElement =
        document.getElementById(vertex);

    if (vertexElement) {

        vertexElement.classList.add(
            "backtrack"
        );
    }
}


function highlightAssignedEdges(
    vertex
) {

    edges.forEach(function(edge) {

        let other = null;

        if (edge[0] === vertex) {

            other = edge[1];

        } else if (edge[1] === vertex) {

            other = edge[0];
        }

        if (!other) {

            return;
        }

        const otherElement =
            document.getElementById(other);

        if (!otherElement) {

            return;
        }

        /*
         * If the other vertex already has a color,
         * use that source vertex color for the edge.
         */

        const background =
            otherElement.style.background;

        if (
            background &&
            background !== "rgb(148, 163, 184)"
        ) {

            const element =
                getEdgeElement(
                    edge[0],
                    edge[1]
                );

            if (!element) {

                return;
            }

            element.classList.remove(
                "try",
                "conflict",
                "backtrack"
            );

            element.classList.add(
                "assigned"
            );

            element.style.stroke =
                background;

            element.style.strokeWidth =
                "7";
        }
    });
}


function highlightAllAssignedEdges() {

    document.querySelectorAll(
        ".edge"
    ).forEach(function(edge) {

        edge.classList.remove(
            "try",
            "conflict",
            "backtrack"
        );

        edge.classList.add(
            "assigned"
        );

    });
}


/* =========================
   STEP LOG
========================= */

function addStep(step) {

    const stepsDiv =
        document.getElementById(
            "steps"
        );

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "step";

    if (step.type === "try") {

        div.classList.add(
            "try"
        );
    }

    if (step.type === "conflict") {

        div.classList.add(
            "conflict"
        );
    }

    if (step.type === "backtrack") {

        div.classList.add(
            "backtrack"
        );
    }

    if (
        step.type === "assign" ||
        step.type === "success"
    ) {

        div.classList.add(
            "success"
        );
    }

    div.innerHTML =
        "<strong>Step " +
        currentStep +
        ":</strong> " +
        step.message;

    stepsDiv.appendChild(div);

    stepsDiv.scrollTop =
        stepsDiv.scrollHeight;
}


function clearStepPanel() {

    document.getElementById(
        "steps"
    ).innerHTML = "";

}


/* =========================
   COUNTERS
========================= */

function updateBacktrackCounter() {

    const element =
        document.getElementById(
            "backtrackCount"
        );

    if (!element) {

        return;
    }

    element.textContent =
        String(backtracks);

    /*
     * Small visual feedback whenever
     * the counter changes.
     */

    element.style.transform =
        "scale(1.25)";

    setTimeout(function() {

        element.style.transform =
            "scale(1)";

    }, 200);
}


function updateCounters() {

    const edgeElement =
        document.getElementById(
            "edgeCount"
        );

    if (edgeElement) {

        edgeElement.textContent =
            String(edges.length);
    }

    const stepElement =
        document.getElementById(
            "stepCount"
        );

    if (stepElement) {

        stepElement.textContent =
            String(currentStep);
    }

    const backtrackElement =
        document.getElementById(
            "backtrackCount"
        );

    if (backtrackElement) {

        backtrackElement.textContent =
            String(backtracks);
    }

    const assignmentElement =
        document.getElementById(
            "assignmentCount"
        );

    if (assignmentElement) {

        assignmentElement.textContent =
            String(assignments);
    }
}


/* =========================
   PROGRESS
========================= */

function updateProgress() {

    const progressBar =
        document.getElementById(
            "progressBar"
        );

    if (!progressBar) {

        return;
    }

    if (steps.length === 0) {

        progressBar.style.width =
            "0%";

        return;
    }

    const progress =
        (currentStep / steps.length) * 100;

    progressBar.style.width =
        Math.min(
            progress,
            100
        ) + "%";
}


/* =========================
   STATUS
========================= */

function setStatus(
    message,
    className
) {

    const status =
        document.getElementById(
            "status"
        );

    if (!status) {

        return;
    }

    status.className =
        "status";

    if (className) {

        status.classList.add(
            className
        );
    }

    status.textContent =
        message;
}


/* =========================
   ADJACENCY LIST
========================= */

function updateAdjacency() {

    const container =
        document.getElementById(
            "adjacencyList"
        );

    if (!container) {

        return;
    }

    container.innerHTML = "";

    vertices.forEach(function(vertex) {

        const neighbors =
            getNeighbors(vertex);

        const div =
            document.createElement(
                "div"
            );

        div.innerHTML =
            "<strong>" +
            vertex +
            "</strong> → " +
            (
                neighbors.length
                    ? neighbors.join(", ")
                    : "—"
            );

        container.appendChild(div);
    });
}


/* =========================
   DRAW GRAPH
========================= */

function drawGraph() {

    const svg =
        document.getElementById(
            "svgGraph"
        );

    if (!svg) {

        return;
    }

    svg.innerHTML = "";

    const graph =
        document.getElementById(
            "graph"
        );

    const width =
        graph.clientWidth;

    const height =
        graph.clientHeight;

    const positions = {

        A: {
            x: width * 0.15,
            y: height * 0.20
        },

        B: {
            x: width * 0.85,
            y: height * 0.20
        },

        C: {
            x: width * 0.15,
            y: height * 0.80
        },

        D: {
            x: width * 0.85,
            y: height * 0.80
        }

    };

    edges.forEach(function(edge, index) {

        const start =
            positions[edge[0]];

        const end =
            positions[edge[1]];

        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

        line.setAttribute(
            "x1",
            start.x
        );

        line.setAttribute(
            "y1",
            start.y
        );

        line.setAttribute(
            "x2",
            end.x
        );

        line.setAttribute(
            "y2",
            end.y
        );

        line.setAttribute(
            "class",
            "edge"
        );

        line.dataset.edge =
            index;

        svg.appendChild(
            line
        );
    });
}


/* =========================
   RESET
========================= */

function resetSimulation() {

    stopPlaying();

    currentStep = 0;

    backtracks = 0;

    assignments = 0;

    steps = [];

    finalSolution = null;

    simulationRunning = false;

    resetVertices();

    clearEdgesHighlight();

    clearStepPanel();

    document.getElementById(
        "startBtn"
    ).disabled = false;

    document.getElementById(
        "nextBtn"
    ).disabled = true;

    document.getElementById(
        "playBtn"
    ).disabled = true;

    document.getElementById(
        "stepCount"
    ).textContent = "0";

    document.getElementById(
        "backtrackCount"
    ).textContent = "0";

    const assignmentElement =
        document.getElementById(
            "assignmentCount"
        );

    if (assignmentElement) {

        assignmentElement.textContent =
            "0";
    }

    document.getElementById(
        "progressBar"
    ).style.width = "0%";

    setStatus(
        "Status: Ready",
        "status"
    );

    document.getElementById(
        "solution"
    ).style.display = "none";

    document.getElementById(
        "steps"
    ).innerHTML =
        '<div class="step">Waiting to start...</div>';

    updateAdjacency();

    drawGraph();

    updateCounters();
}


/* =========================
   INITIALIZATION
========================= */

function initialize() {

    /*
     * Start with the complete graph so the
     * Backtracking Demo is immediately available.
     */

    edges = demoEdges.map(function(edge) {

        return [...edge];

    });

    updateAdjacency();

    drawGraph();

    updateCounters();

    resetSimulation();


    document.getElementById(
        "startBtn"
    ).addEventListener(
        "click",
        startSimulation
    );


    document.getElementById(
        "nextBtn"
    ).addEventListener(
        "click",
        nextStep
    );


    document.getElementById(
        "playBtn"
    ).addEventListener(
        "click",
        playSimulation
    );


    document.getElementById(
        "resetBtn"
    ).addEventListener(
        "click",
        resetSimulation
    );


    document.getElementById(
        "addEdgeBtn"
    ).addEventListener(
        "click",
        addEdge
    );


    document.getElementById(
        "removeEdgeBtn"
    ).addEventListener(
        "click",
        removeEdge
    );


    document.getElementById(
        "clearBtn"
    ).addEventListener(
        "click",
        clearEdges
    );


    document.getElementById(
        "randomBtn"
    ).addEventListener(
        "click",
        generateRandomGraph
    );


    document.getElementById(
        "demoBtn"
    ).addEventListener(
        "click",
        generateBacktrackingDemo
    );


    window.addEventListener(
        "resize",
        function() {

            drawGraph();

        }
    );
}


document.addEventListener(
    "DOMContentLoaded",
    initialize
);