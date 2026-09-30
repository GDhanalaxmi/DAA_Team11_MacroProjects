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

let edges = [];

let steps = [];

let currentStep = 0;

let backtracks = 0;

let simulationRunning = false;

let finalSolution = null;


function edgeExists(a, b) {

    return edges.some(function(edge) {

        return (
            (edge[0] === a && edge[1] === b) ||
            (edge[0] === b && edge[1] === a)
        );

    });

}


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

    drawGraph();

    updateAdjacency();

    resetSimulation();

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


    drawGraph();

    updateAdjacency();

    resetSimulation();

}


function clearEdges() {

    if (simulationRunning) {

        alert("Reset the simulation before changing edges.");

        return;
    }


    edges = [];

    drawGraph();

    updateAdjacency();

    resetSimulation();

}


function generateRandomGraph() {

    if (simulationRunning) {

        alert(
            "Reset the simulation before generating a new graph."
        );

        return;
    }


    edges = [];


    const possibleEdges = [

        ["A", "B"],
        ["A", "C"],
        ["A", "D"],
        ["B", "C"],
        ["B", "D"],
        ["C", "D"]

    ];


    possibleEdges.forEach(function(edge) {

        if (Math.random() < 0.5) {

            edges.push(edge);

        }

    });


    drawGraph();

    updateAdjacency();

    resetSimulation();


    document.getElementById("status").innerText =
        "Status: Random graph generated";

}


function generateBacktrackingDemo() {

    if (simulationRunning) {

        alert(
            "Reset the simulation before generating a new graph."
        );

        return;
    }


    edges = [

        ["A", "B"],
        ["A", "C"],
        ["A", "D"],
        ["B", "C"],
        ["B", "D"],
        ["C", "D"]

    ];


    drawGraph();

    updateAdjacency();

    resetSimulation();


    document.getElementById("status").innerText =
        "Status: Backtracking demonstration graph ready";

}


function getNeighbors(vertex) {

    const neighbors = [];


    edges.forEach(function(edge) {

        if (edge[0] === vertex) {

            neighbors.push(edge[1]);

        }

        else if (edge[1] === vertex) {

            neighbors.push(edge[0]);

        }

    });


    return neighbors;

}


function isSafe(vertex, colorIndex, assignment) {

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

                message:
                    "Try " +
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

                    message:
                        "Assign " +
                        color.name +
                        " to vertex " +
                        vertex

                });


                if (
                    solve(index + 1)
                ) {

                    return true;

                }


                assignment[vertex] =
                    null;


                trace.push({

                    type: "backtrack",

                    vertex: vertex,

                    color: color.name,

                    message:
                        "Backtrack from vertex " +
                        vertex +
                        " → remove " +
                        color.name

                });

            }

            else {

                trace.push({

                    type: "conflict",

                    vertex: vertex,

                    color: color.name,

                    message:
                        "Conflict! " +
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


function startSimulation() {

    if (edges.length === 0) {

        alert(
            "Add at least one edge or generate a random graph."
        );

        return;
    }


    const result =
        generateTrace();


    steps =
        result.trace;


    finalSolution =
        result.solution;


    currentStep = 0;

    backtracks = 0;

    simulationRunning = true;


    resetVertices();

    clearStepPanel();


    document.getElementById("startBtn")
        .disabled = true;


    document.getElementById("nextBtn")
        .disabled = false;


    document.getElementById("solution")
        .style.display = "none";


    document.getElementById("status")
        .className = "status";


    document.getElementById("status")
        .innerText =
        "Status: Simulation started";


    updateCounters();

}


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


    addStep(step);


    if (step.type === "backtrack") {

        backtracks++;

        document.getElementById(
            "backtrackCount"
        ).innerText =
            backtracks;

    }


    if (
        step.vertex &&
        step.color &&
        (
            step.type === "assign" ||
            step.type === "try"
        )
    ) {

        if (step.type === "assign") {

            colorVertex(
                step.vertex,
                step.color
            );

        }

        else {

            activateVertex(
                step.vertex
            );

        }

    }


    if (step.type === "conflict") {

        showConflict(
            step.vertex
        );


        document.getElementById("status")
            .className =
            "status error-status";


        document.getElementById("status")
            .innerText =
            "Status: Conflict detected";

    }


    else if (step.type === "backtrack") {

        resetVertex(
            step.vertex
        );


        document.getElementById("status")
            .className =
            "status warning-status";


        document.getElementById("status")
            .innerText =
            "Status: Backtracking from " +
            step.vertex +
            " | Backtracks: " +
            backtracks;

    }


    else if (step.type === "assign") {

        clearActiveVertices();


        document.getElementById("status")
            .className =
            "status";


        document.getElementById("status")
            .innerText =
            "Status: " +
            step.vertex +
            " = " +
            step.color;

    }


    else if (step.type === "failure") {

        document.getElementById("status")
            .className =
            "status error-status";


        document.getElementById("status")
            .innerText =
            "Status: No valid 3-coloring exists";

    }


    else if (step.type === "success") {

        document.getElementById("status")
            .className =
            "status success-status";


        document.getElementById("status")
            .innerText =
            "Status: Valid coloring found ✓";

    }


    updateCounters();


    const progress =
        (currentStep / steps.length) * 100;


    document.getElementById("progressBar")
        .style.width =
        progress + "%";


    if (currentStep >= steps.length) {

        finishSimulation();

    }

}


function finishSimulation() {

    simulationRunning = false;


    document.getElementById("nextBtn")
        .disabled = true;


    document.getElementById("startBtn")
        .disabled = false;


    if (finalSolution) {

        document.getElementById("solution")
            .style.display = "block";


        document.getElementById("solution")
            .className =
            "solution";


        document.getElementById("solution")
            .innerHTML =
            "✓ Valid 3-coloring found! " +
            "Backtracks: " +
            backtracks;


        document.getElementById("status")
            .className =
            "status success-status";


        document.getElementById("status")
            .innerText =
            "Status: Solution Found ✓";

    }

    else {

        document.getElementById("solution")
            .style.display = "block";


        document.getElementById("solution")
            .className =
            "solution no-solution";


        document.getElementById("solution")
            .innerHTML =
            "✗ No valid 3-coloring exists. " +
            "Backtracks: " +
            backtracks;


        document.getElementById("status")
            .className =
            "status error-status";


        document.getElementById("status")
            .innerText =
            "Status: No Solution";

    }


    clearActiveVertices();

}


function colorVertex(
    vertex,
    colorName
) {

    const element =
        document.getElementById(vertex);


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

}


function resetVertex(vertex) {

    const element =
        document.getElementById(vertex);


    element.style.background =
        "#94a3b8";


    element.classList.remove(
        "active"
    );


    element.classList.remove(
        "conflict"
    );

}


function resetVertices() {

    vertices.forEach(function(vertex) {

        resetVertex(vertex);

    });

}


function activateVertex(vertex) {

    clearActiveVertices();


    document.getElementById(vertex)
        .classList.add("active");

}


function clearActiveVertices() {

    vertices.forEach(function(vertex) {

        document.getElementById(vertex)
            .classList.remove("active");

    });

}


function showConflict(vertex) {

    clearActiveVertices();


    const element =
        document.getElementById(vertex);


    element.classList.add(
        "conflict"
    );


    element.classList.add(
        "active"
    );

}


function addStep(step) {

    const stepsDiv =
        document.getElementById("steps");


    const div =
        document.createElement("div");


    div.className =
        "step";


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


    if (step.type === "try") {

        div.classList.add(
            "try"
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

    document.getElementById("steps")
        .innerHTML = "";

}


function updateCounters() {

    document.getElementById("edgeCount")
        .innerText =
        edges.length;


    document.getElementById("stepCount")
        .innerText =
        currentStep;


    document.getElementById("backtrackCount")
        .innerText =
        backtracks;

}


function updateAdjacency() {

    const container =
        document.getElementById(
            "adjacencyList"
        );


    container.innerHTML = "";


    vertices.forEach(function(vertex) {

        const neighbors =
            getNeighbors(vertex);


        const div =
            document.createElement("div");


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


function drawGraph() {

    const svg =
        document.getElementById(
            "svgGraph"
        );


    svg.innerHTML = "";


    const positions = {

        A: {
            x: 15,
            y: 25
        },

        B: {
            x: 85,
            y: 25
        },

        C: {
            x: 15,
            y: 75
        },

        D: {
            x: 85,
            y: 75
        }

    };


    edges.forEach(function(edge, index) {

        const a =
            positions[edge[0]];


        const b =
            positions[edge[1]];


        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );


        line.setAttribute(
            "x1",
            a.x + "%"
        );


        line.setAttribute(
            "y1",
            a.y + "%"
        );


        line.setAttribute(
            "x2",
            b.x + "%"
        );


        line.setAttribute(
            "y2",
            b.y + "%"
        );


        line.setAttribute(
            "class",
            "edge"
        );


        line.setAttribute(
            "data-edge",
            index
        );


        svg.appendChild(line);

    });


    updateCounters();

}


function resetSimulation() {

    currentStep = 0;

    backtracks = 0;

    steps = [];

    finalSolution = null;

    simulationRunning = false;


    resetVertices();


    document.getElementById("startBtn")
        .disabled = false;


    document.getElementById("nextBtn")
        .disabled = true;


    document.getElementById("stepCount")
        .innerText = "0";


    document.getElementById("backtrackCount")
        .innerText = "0";


    document.getElementById("progressBar")
        .style.width = "0%";


    document.getElementById("status")
        .className = "status";


    document.getElementById("status")
        .innerText =
        "Status: Ready";


    document.getElementById("solution")
        .style.display = "none";


    document.getElementById("steps")
        .innerHTML =
        '<div class="step">Waiting to start...</div>';


    drawGraph();

}


drawGraph();

updateAdjacency();

updateCounters();