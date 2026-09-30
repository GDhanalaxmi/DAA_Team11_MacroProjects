// ======================================================
// TSP - DYNAMIC PROGRAMMING VISUALIZER
// ======================================================


// ======================================================
// BASIC DATA
// ======================================================

const cities = ["A", "B", "C", "D"];

const n = cities.length;


// Default distance matrix

let distance = [

    [0, 10, 15, 20],

    [10, 0, 35, 25],

    [15, 35, 0, 30],

    [20, 25, 30, 0]

];


// ======================================================
// CANVAS
// ======================================================

const canvas =
    document.getElementById("cityCanvas");

const ctx =
    canvas.getContext("2d");


// City positions

const positions = {

    A: {
        x: 300,
        y: 60
    },

    B: {
        x: 100,
        y: 250
    },

    C: {
        x: 500,
        y: 250
    },

    D: {
        x: 300,
        y: 350
    }

};


// ======================================================
// DP VARIABLES
// ======================================================

let dp = [];

let parent = [];

let steps = [];

let currentStep = -1;

let autoPlayTimer = null;

let finalResult = null;


// ======================================================
// 1. DISPLAY EDITABLE DISTANCE MATRIX
// ======================================================

function displayDistanceMatrix() {

    let html = "<table>";

    html += `
        <tr>
            <th></th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
            <th>D</th>
        </tr>
    `;


    for (
        let i = 0;
        i < n;
        i++
    ) {

        html += `
            <tr>
                <th>${cities[i]}</th>
        `;


        for (
            let j = 0;
            j < n;
            j++
        ) {

            // Diagonal

            if (i === j) {

                html += `
                    <td>
                        <input
                            class="matrix-input"
                            type="number"
                            value="0"
                            disabled>
                    </td>
                `;

                continue;
            }


            // Upper triangle is editable

            if (j > i) {

                html += `
                    <td>
                        <input
                            class="matrix-input"
                            id="distance-${i}-${j}"
                            type="number"
                            min="1"
                            value="${distance[i][j]}"
                            onchange="syncMatrixInput(${i}, ${j})">
                    </td>
                `;

            } else {

                // Lower triangle automatically mirrors
                // the upper triangle

                html += `
                    <td>
                        <input
                            class="matrix-input"
                            id="distance-${i}-${j}"
                            type="number"
                            value="${distance[i][j]}"
                            disabled>
                    </td>
                `;
            }
        }


        html += "</tr>";
    }


    html += "</table>";


    document.getElementById(
        "distanceMatrix"
    ).innerHTML = html;
}


// ======================================================
// 2. SYNC OPPOSITE MATRIX VALUE
// ======================================================

function syncMatrixInput(i, j) {

    const input =
        document.getElementById(
            `distance-${i}-${j}`
        );


    if (!input) {

        return;
    }


    let value =
        parseInt(input.value);


    if (
        isNaN(value) ||
        value <= 0
    ) {

        return;
    }


    // Keep matrix symmetric

    const opposite =
        document.getElementById(
            `distance-${j}-${i}`
        );


    if (opposite) {

        opposite.value =
            value;
    }
}


// ======================================================
// 3. UPDATE MATRIX AND SOLVE
// ======================================================

function updateMatrixAndSolve() {

    // Stop autoplay

    if (
        autoPlayTimer !== null
    ) {

        clearInterval(
            autoPlayTimer
        );

        autoPlayTimer = null;
    }


    let newDistance =
        Array.from(
            { length: n },
            () =>
                Array(n).fill(0)
        );


    // Read upper triangle

    for (
        let i = 0;
        i < n;
        i++
    ) {

        for (
            let j = i + 1;
            j < n;
            j++
        ) {

            const input =
                document.getElementById(
                    `distance-${i}-${j}`
                );


            if (!input) {

                continue;
            }


            const value =
                parseInt(input.value);


            // Validate

            if (
                isNaN(value) ||
                value <= 0
            ) {

                showMatrixMessage(
                    "Please enter positive distances for every city.",
                    false
                );

                return;
            }


            newDistance[i][j] =
                value;

            newDistance[j][i] =
                value;
        }
    }


    // Replace matrix

    distance =
        newDistance;


    // Recalculate TSP

    finalResult =
        calculateTSP();


    // Reset visualization

    currentStep = -1;


    document.getElementById(
        "route"
    ).innerHTML = "";


    document.getElementById(
        "cost"
    ).innerHTML = "";


    displayStep();


    showMatrixMessage(
        "Matrix updated successfully. Click Next to start the new DP calculation.",
        true
    );
}


// ======================================================
// 4. MATRIX MESSAGE
// ======================================================

function showMatrixMessage(
    message,
    success
) {

    const element =
        document.getElementById(
            "matrixMessage"
        );


    element.innerHTML =
        message;


    if (success) {

        element.className =
            "message-success";

    } else {

        element.className =
            "message-error";
    }
}


// ======================================================
// 5. DRAW CITY GRAPH
// ======================================================

function drawCityGraph(
    highlightRoute = [],
    activeTransition = null
) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // --------------------------------------------------
    // Normal connections
    // --------------------------------------------------

    for (
        let i = 0;
        i < n;
        i++
    ) {

        for (
            let j = i + 1;
            j < n;
            j++
        ) {

            const city1 =
                cities[i];

            const city2 =
                cities[j];


            const x1 =
                positions[city1].x;

            const y1 =
                positions[city1].y;

            const x2 =
                positions[city2].x;

            const y2 =
                positions[city2].y;


            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );


            ctx.strokeStyle =
                "#cbd5e1";

            ctx.lineWidth =
                2;

            ctx.stroke();


            // Distance label

            const midX =
                (x1 + x2) / 2;

            const midY =
                (y1 + y2) / 2;


            ctx.fillStyle =
                "#334155";

            ctx.font =
                "bold 12px Arial";

            ctx.textAlign =
                "center";


            ctx.fillText(
                distance[i][j],
                midX,
                midY - 5
            );
        }
    }


    // --------------------------------------------------
    // Current transition
    // --------------------------------------------------

    if (
        activeTransition
    ) {

        const city1 =
            cities[
                activeTransition.previousCity
            ];


        const city2 =
            cities[
                activeTransition.city
            ];


        const x1 =
            positions[city1].x;

        const y1 =
            positions[city1].y;

        const x2 =
            positions[city2].x;

        const y2 =
            positions[city2].y;


        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );


        ctx.strokeStyle =
            "#2563eb";

        ctx.lineWidth =
            6;

        ctx.stroke();
    }


    // --------------------------------------------------
    // Final optimal route
    // --------------------------------------------------

    if (
        highlightRoute.length > 1
    ) {

        ctx.strokeStyle =
            "#16a34a";

        ctx.lineWidth =
            9;

        ctx.lineCap =
            "round";


        for (
            let i = 0;
            i < highlightRoute.length - 1;
            i++
        ) {

            const city1 =
                highlightRoute[i];

            const city2 =
                highlightRoute[i + 1];


            const x1 =
                positions[city1].x;

            const y1 =
                positions[city1].y;

            const x2 =
                positions[city2].x;

            const y2 =
                positions[city2].y;


            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );

            ctx.stroke();
        }


        ctx.lineCap =
            "butt";
    }


    // --------------------------------------------------
    // City nodes
    // --------------------------------------------------

    for (
        let city of cities
    ) {

        const x =
            positions[city].x;

        const y =
            positions[city].y;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            25,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#111827";

        ctx.fill();


        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth =
            2;

        ctx.stroke();


        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 18px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            city,
            x,
            y
        );
    }


    ctx.textBaseline =
        "alphabetic";
}


// ======================================================
// 6. GET SUBSET
// ======================================================

function getSubset(mask) {

    let result = [];


    for (
        let i = 0;
        i < n;
        i++
    ) {

        if (
            mask & (1 << i)
        ) {

            result.push(
                cities[i]
            );
        }
    }


    return result;
}


// ======================================================
// 7. FORMAT SUBSET
// ======================================================

function formatSubset(mask) {

    return (
        "{" +
        getSubset(mask).join(", ") +
        "}"
    );
}


// ======================================================
// 8. CALCULATE TSP
// ======================================================

function calculateTSP() {

    const totalMasks =
        1 << n;


    dp = Array.from(
        {
            length: totalMasks
        },

        () =>
            Array(n).fill(
                Infinity
            )
    );


    parent = Array.from(
        {
            length: totalMasks
        },

        () =>
            Array(n).fill(-1)
    );


    steps = [];


    // --------------------------------------------------
    // Starting state
    // --------------------------------------------------

    dp[1][0] = 0;


    steps.push({

        type:
            "stateComplete",

        mask:
            1,

        city:
            0,

        cost:
            0,

        text: `

            <div class="step-title">
                Step 1: Starting State
            </div>

            <div>
                Start from city
                <strong>A</strong>.
            </div>

            <div class="formula">
                dp[{A}][A] = 0
            </div>

        `
    });


    // --------------------------------------------------
    // DP states
    // --------------------------------------------------

    for (
        let mask = 1;
        mask < totalMasks;
        mask++
    ) {

        // Starting city must be included

        if (
            !(mask & 1)
        ) {

            continue;
        }


        for (
            let current = 0;
            current < n;
            current++
        ) {

            if (
                !(mask &
                (1 << current))
            ) {

                continue;
            }


            // Skip starting state

            if (
                mask === 1 &&
                current === 0
            ) {

                continue;
            }


            const previousMask =
                mask ^
                (1 << current);


            // Previous state must contain A

            if (
                !(previousMask & 1)
            ) {

                continue;
            }


            let bestCost =
                Infinity;

            let bestPrevious =
                -1;

            let candidates = [];


            // --------------------------------------------------
            // Try every previous city
            // --------------------------------------------------

            for (
                let previous = 0;
                previous < n;
                previous++
            ) {

                if (
                    !(previousMask &
                    (1 << previous))
                ) {

                    continue;
                }


                if (
                    dp[
                        previousMask
                    ][previous] === Infinity
                ) {

                    continue;
                }


                const newCost =
                    dp[
                        previousMask
                    ][previous]
                    +
                    distance[
                        previous
                    ][current];


                candidates.push({

                    previous:
                        cities[previous],

                    previousCost:
                        dp[
                            previousMask
                        ][previous],

                    travel:
                        distance[
                            previous
                        ][current],

                    total:
                        newCost

                });


                if (
                    newCost <
                    bestCost
                ) {

                    bestCost =
                        newCost;

                    bestPrevious =
                        previous;
                }
            }


            // --------------------------------------------------
            // Store minimum
            // --------------------------------------------------

            if (
                bestPrevious !== -1
            ) {

                dp[mask][current] =
                    bestCost;


                parent[mask][current] =
                    bestPrevious;


                let candidateHTML =
                    "";


                for (
                    let candidate
                    of candidates
                ) {

                    candidateHTML += `

                        <div>

                            ${candidate.previous}
                            →
                            ${cities[current]}

                            :

                            ${candidate.previousCost}
                            +
                            ${candidate.travel}

                            =

                            <strong>
                                ${candidate.total}
                            </strong>

                        </div>

                    `;
                }


                steps.push({

                    type:
                        "stateComplete",

                    mask:
                        mask,

                    city:
                        current,

                    cost:
                        bestCost,

                    previousCity:
                        bestPrevious,

                    text: `

                        <div class="step-title">
                            DP State Generated
                        </div>

                        <div>
                            State:

                            <strong>
                                dp[
                                ${formatSubset(mask)}
                                ][
                                ${cities[current]}
                                ]
                            </strong>
                        </div>

                        <div class="formula">

                            ${candidateHTML}

                            <hr>

                            Minimum Cost:

                            <strong>
                                ${bestCost}
                            </strong>

                        </div>

                    `
                });
            }
        }
    }


    // ==================================================
    // FINAL COST
    // ==================================================

    const fullMask =
        (1 << n) - 1;


    let finalCost =
        Infinity;

    let finalCity =
        -1;


    for (
        let city = 1;
        city < n;
        city++
    ) {

        const routeCost =
            dp[fullMask][city]
            +
            distance[city][0];


        if (
            routeCost <
            finalCost
        ) {

            finalCost =
                routeCost;

            finalCity =
                city;
        }
    }


    // ==================================================
    // RECONSTRUCT ROUTE
    // ==================================================

    let mask =
        fullMask;

    let city =
        finalCity;


    let reverseRoute = [];


    while (
        city !== 0 &&
        city !== -1
    ) {

        reverseRoute.push(
            city
        );


        const previous =
            parent[
                mask
            ][
                city
            ];


        mask =
            mask ^
            (1 << city);


        city =
            previous;
    }


    reverseRoute.reverse();


    const route =
        [
            0,
            ...reverseRoute,
            0
        ];


    const routeNames =
        route.map(
            index =>
                cities[index]
        );


    // ==================================================
    // FINAL STEP
    // ==================================================

    steps.push({

        type:
            "final",

        route:
            routeNames,

        cost:
            finalCost,

        text: `

            <div class="step-title">
                Final Answer
            </div>

            <div>
                All four cities have
                been visited.
            </div>

            <div class="formula">
                Return to starting city A
            </div>

            <div>
                Optimal Route:

                <strong>
                    ${routeNames.join(" → ")}
                </strong>
            </div>

            <div>
                Minimum Cost:

                <strong>
                    ${finalCost}
                </strong>
            </div>

        `
    });


    return {

        route:
            routeNames,

        cost:
            finalCost
    };
}


// ======================================================
// 9. DISPLAY DP TABLE
// ======================================================

function displayDPTable() {

    const container =
        document.getElementById(
            "dpTable"
        );


    let completedStates = [];


    // Add states generated so far

    for (
        let i = 0;
        i <= currentStep;
        i++
    ) {

        const step =
            steps[i];


        if (
            step &&
            step.type ===
            "stateComplete"
        ) {

            const alreadyExists =
                completedStates.some(
                    item =>
                        item.mask ===
                        step.mask
                        &&
                        item.city ===
                        step.city
                );


            if (
                !alreadyExists
            ) {

                completedStates.push({

                    mask:
                        step.mask,

                    city:
                        step.city,

                    cost:
                        step.cost
                });
            }
        }
    }


    // Empty state

    if (
        completedStates.length === 0
    ) {

        container.innerHTML = `

            <div class="dp-empty">

                DP table is empty.

                <br>

                Click
                <strong>Next</strong>
                to generate the first DP state.

            </div>

        `;

        return;
    }


    // Table

    let html = `

        <div class="dp-progress">

            Generated DP states:
            ${completedStates.length}

        </div>

        <table>

            <tr>

                <th>
                    Visited Set
                </th>

                <th>
                    Current City
                </th>

                <th>
                    Minimum Cost
                </th>

            </tr>

    `;


    for (
        let item
        of completedStates
    ) {

        html += `

            <tr>

                <td>
                    ${formatSubset(item.mask)}
                </td>

                <td>
                    ${cities[item.city]}
                </td>

                <td>
                    ${item.cost}
                </td>

            </tr>

        `;
    }


    html += "</table>";


    container.innerHTML =
        html;
}


// ======================================================
// 10. DISPLAY CURRENT STEP
// ======================================================

function displayStep() {

    const stateBox =
        document.getElementById(
            "state"
        );


    displayDPTable();


    // Initial screen

    if (
        currentStep < 0
    ) {

        stateBox.innerHTML = `

            <div>

                <div class="step-title">
                    Ready to Start
                </div>

                <div>
                    Click
                    <strong>Next</strong>
                    to generate the first
                    DP state.
                </div>

            </div>

        `;


        document.getElementById(
            "route"
        ).innerHTML = "";


        document.getElementById(
            "cost"
        ).innerHTML = "";


        drawCityGraph();

        return;
    }


    // Current step

    const step =
        steps[currentStep];


    stateBox.innerHTML =
        step.text;


    // Final result

    if (
        step.type ===
        "final"
    ) {

        document.getElementById(
            "route"
        ).innerHTML =
            `Optimal Route:
             ${step.route.join(" → ")}`;


        document.getElementById(
            "cost"
        ).innerHTML =
            `Minimum Cost:
             ${step.cost}`;


        drawCityGraph(
            step.route
        );


        return;
    }


    // Hide result until final step

    document.getElementById(
        "route"
    ).innerHTML = "";


    document.getElementById(
        "cost"
    ).innerHTML = "";


    // Highlight current transition

    if (
        step.previousCity !==
        undefined
    ) {

        drawCityGraph(
            [],
            {
                previousCity:
                    step.previousCity,

                city:
                    step.city
            }
        );

    } else {

        drawCityGraph();
    }
}


// ======================================================
// 11. NEXT
// ======================================================

function nextStep() {

    if (
        currentStep <
        steps.length - 1
    ) {

        currentStep++;

        displayStep();
    }
}


// ======================================================
// 12. PREVIOUS
// ======================================================

function previousStep() {

    if (
        currentStep > 0
    ) {

        currentStep--;

        displayStep();

    } else if (
        currentStep === 0
    ) {

        currentStep = -1;

        displayStep();
    }
}


// ======================================================
// 13. AUTO PLAY
// ======================================================

function autoPlay() {

    // Stop autoplay

    if (
        autoPlayTimer !== null
    ) {

        clearInterval(
            autoPlayTimer
        );

        autoPlayTimer =
            null;

        return;
    }


    // Restart after completion

    if (
        currentStep >=
        steps.length - 1
    ) {

        currentStep = -1;

        displayStep();
    }


    autoPlayTimer =
        setInterval(
            () => {

                if (
                    currentStep <
                    steps.length - 1
                ) {

                    currentStep++;

                    displayStep();

                } else {

                    clearInterval(
                        autoPlayTimer
                    );

                    autoPlayTimer =
                        null;
                }

            },

            1200
        );
}


// ======================================================
// 14. RESET
// ======================================================

function resetVisualization() {

    if (
        autoPlayTimer !== null
    ) {

        clearInterval(
            autoPlayTimer
        );

        autoPlayTimer =
            null;
    }


    currentStep =
        -1;


    document.getElementById(
        "route"
    ).innerHTML = "";


    document.getElementById(
        "cost"
    ).innerHTML = "";


    document.getElementById(
        "matrixMessage"
    ).innerHTML = "";


    displayStep();
}


// ======================================================
// 15. START
// ======================================================

displayDistanceMatrix();

finalResult =
    calculateTSP();

displayStep();