const readline = require('readline/promises');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const HANDLES = ["Arc.", "NeverEnf", "NoLosses", "4U.", "PrimeVersion", "WalkingAlone", "We_Still_Run_The_Game"];
const FAVORITE_PROBLEMS = new Set([
    "2195_F"
]);

async function getAttemptedData(handles) {
    const attemptedProblems = new Set();
    const attemptedContests = new Set();

    console.log("Fetching user data...");
    for (const handle of handles) {
        const url = `https://codeforces.com/api/user.status?handle=${handle}`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK') {
                data.result.forEach(submission => {
                    const problem = submission.problem;
                    if (problem.contestId && problem.index) {
                        attemptedProblems.add(`${problem.contestId}_${problem.index}`);
                        attemptedContests.add(problem.contestId);
                    }
                });
            }
        } catch (error) {
            console.error(`Error fetching data for ${handle}: ${error.message}`);
        }
    }
    return { attemptedProblems, attemptedContests };
}

async function getRatedContests() {
    console.log("Filtering rated contests...");
    const url = "https://codeforces.com/api/contest.list";
    const ratedContests = new Set();
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK') {
            data.result.forEach(contest => {
                const name = (contest.name || "").toLowerCase();
                if (!name.includes('unrated')) {
                    ratedContests.add(contest.id);
                }
            });
        }
    } catch (error) {
        console.error(`Failed to fetch contest list: ${error.message}`);
    }
    return ratedContests;
}

async function getAllProblems() {
    console.log("Fetching problemset...");
    const url = "https://codeforces.com/api/problemset.problems";
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK') {
            const problems = data.result.problems;
            return problems.sort((a, b) => (b.contestId || 0) - (a.contestId || 0));
        }
    } catch (error) {
        console.error(`Failed to fetch problemset: ${error.message}`);
    }
    return [];
}

function extractAllTags(problems) {
    const tagsSet = new Set();
    problems.forEach(p => {
        if (p.tags) {
            p.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
        }
    });
    return Array.from(tagsSet).sort();
}

function findProblem(problems, attemptedData, ratedContests, minRating, maxRating, desiredTags) {
    const { attemptedProblems, attemptedContests } = attemptedData;

    const ratingFiltered = problems.filter(p => 
        p.rating && p.rating >= minRating && p.rating <= maxRating
    );

    if (ratingFiltered.length === 0) return null;

    return ratingFiltered.find(p => {
        const problemId = `${p.contestId}_${p.index}`;
        const problemTags = p.tags || [];
        
        const isAvailable = attemptedContests.has(p.contestId) && 
                            ratedContests.has(p.contestId) &&
                            !attemptedProblems.has(problemId) &&
                            !FAVORITE_PROBLEMS.has(problemId);

        if (!isAvailable) return false;

        if (desiredTags.length > 0) {
            return desiredTags.some(tag => problemTags.includes(tag.toLowerCase()));
        }

        return true;
    });
}

async function main() {
    try {
        console.log("Loading platform data from Codeforces...");
        const problems = await getAllProblems();
        
        if (problems.length === 0) {
            console.log("Could not load problems. Exiting.");
            return;
        }

        const allTags = extractAllTags(problems);
        
        const minRatingRaw = await rl.question("\nEnter Minimum Rating (e.g. 800): ");
        const minRating = parseInt(minRatingRaw) || 800;
        
        const maxRatingRaw = await rl.question("Enter Maximum Rating (e.g. 1200): ");
        const maxRating = parseInt(maxRatingRaw) || 3500;
        
        console.log("\nAvailable Tags:");
        allTags.forEach((tag, idx) => {
            console.log(`[${idx + 1}] ${tag}`);
        });

        const tagsInput = await rl.question("\nEnter the numbers of the tags you want to select (comma-separated, e.g., 12, 19) or leave empty for any: ");
        let desiredTags = [];
        
        if (tagsInput.trim() !== "") {
            const selectedIndices = tagsInput.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < allTags.length);
            desiredTags = selectedIndices.map(idx => allTags[idx]);
        }

        const { attemptedProblems, attemptedContests } = await getAttemptedData(HANDLES);
        const ratedContests = await getRatedContests();

        console.log(`\nSearching for: Rating ${minRating}-${maxRating} | Tags: ${desiredTags.length > 0 ? `[${desiredTags.join(', ')}]` : "Any"}`);
        console.log("-".repeat(50));

        const found = findProblem(problems, { attemptedProblems, attemptedContests }, ratedContests, minRating, maxRating, desiredTags);

        if (found) {
            console.log(`MATCH FOUND:`);
            console.log(`Name:   ${found.name}`);
            console.log(`Rating: ${found.rating}`);
            console.log(`Tags:   ${found.tags.join(', ')}`);
            console.log(`Link:   https://codeforces.com/contest/${found.contestId}/problem/${found.index}`);
        } else {
            console.log(`PROBLME IS NOT AVAILABLE AT THIS rating for this tag`);
        }

    } catch (err) {
        console.error("An error occurred:", err);
    } finally {
        rl.close();
    }
}

main();
