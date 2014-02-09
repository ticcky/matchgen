function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function uniqBy(ary, key) {
    var seen = {};
    return ary.filter(function(elem) {
        var k = key(elem);
        return (seen[k] === 1) ? 0 : seen[k] = 1;
    });
}


function Solution(optimizer) {
    this.optimizer = optimizer;
    this.values = [];
    this.fitness = null;
    this.cachedRounds = null;
    this.cachedTeamRounds = null;
}

Solution.prototype.clone = function() {
    var res = new Solution(this.optimizer);
    for(var i = 0; i < this.values.length; i++) {
        res.values.push(this.values[i]);
    }
    return res;
};

Solution.prototype.shuffle = function() {
    shuffleArray(this.values);
};

Solution.prototype.crossover = function(second, point) {
    // Take a half from the first one and a half from the second one.
    var newMember = new Solution(this.optimizer);
    newMember.values = this.values.slice(0, point)
        .concat(second.values.slice(point));

    return newMember;
};

Solution.prototype.transfer = function() {
    // Destination - this is where we want to transfer.
    var matches = this.optimizer.matches;
    var playgrounds = this.optimizer.playgrounds;

    var roundPlaygrounds = {};
    for(i = 0; i < this.values.length; i++) {
      matches[i].round = this.values[i];
      if(roundPlaygrounds[this.values[i]] === undefined) {
        roundPlaygrounds[this.values[i]] = [];
      }

      matches[i].playground = playgrounds[roundPlaygrounds[this.values[i]].length];
      roundPlaygrounds[this.values[i]].push(i);
    }
};

Solution.prototype.precomputeAndCache = function() {
    var rounds = {};
    var teamRounds = {};
    var i, y, t;
    var match;

    for(i = 0; i < this.values.length; i++) {
        if(rounds[this.values[i]] === undefined) {
            rounds[this.values[i]] = [];
        }

        rounds[this.values[i]].push(i);

        match = this.optimizer.matches[i];

        var t1rounds = getDefault(teamRounds, match.team1.id, []);
        var t2rounds = getDefault(teamRounds, match.team2.id, []);
        t1rounds.push(this.values[i]);
        t2rounds.push(this.values[i]);
    }

    this.cachedRounds = rounds;
    this.cachedTeamRounds = teamRounds;
};

Solution.prototype.getRounds = function() {
    if(this.cachedRounds === null) {
        this.precomputeAndCache();
    }

    return this.cachedRounds;
};

Solution.prototype.hammingFrom = function(second) {
    var distance = 0;
    for(var i = 0; i < this.values.length; i++) {
        if(this.values[i] != second[i]) {
            distance += 1;
        }
    }
    return distance;
};

function noTeamPlaysTwiceEachRound(solution) {
    var result = 0.0;
    var normalizingFactor = 0.0;
    var rounds = solution.getRounds();
    var matches = solution.optimizer.matches;

    // Discount each round that contains overlapping teams.
    for(var i in rounds) {
        if(rounds.hasOwnProperty(i)) {
            if(rounds[i] !== undefined) {
                var roundTeams = {};
                var nonOverlapping = true;
                for(y = 0; y < rounds[i].length; y++) {
                    match = rounds[i][y];
                    var t1 = matches[match].teams[0];
                    var t2 = matches[match].teams[1];

                    if(!(t1 in roundTeams || t2 in roundTeams)) {
                        roundTeams[t1] = true;
                        roundTeams[t2] = true;
                    } else {
                        nonOverlapping = false;
                        break;
                    }
                }

                normalizingFactor += Math.pow(rounds[i].length, 2);
                if(!nonOverlapping) {
                    result += Math.pow(rounds[i].length, 2);
                }
            }
        }
    }

    return 1 - (result / normalizingFactor);
}

function eachRoundHasSameNumberOfMatches(solution) {
    var result = 0.0;
    var normalizingFactor = 0.0;
    var rounds = solution.getRounds();

    // Discount each round that does not have the desired number of matches.
    for(var i in rounds) {
        if(rounds.hasOwnProperty(i)) {
            normalizingFactor += 1;
            if(rounds[i] !== undefined) {
                if(rounds[i].length != solution.optimizer.nPlaygrounds) {
                    if(rounds[i].length > solution.optimizer.nPlaygrounds) {
                        result += 1.0;
                    }
                    else if(rounds[i].length < solution.optimizer.nPlaygrounds) {
                        result += 0.0;
                    }
                }
            } else {
                result += 1.0;
            }
        }
    }

    return 1 - (result / normalizingFactor);
}

function MatchOptimizer(matches, playgrounds, teams) {
    this.P_CLONE = 0.1;
    this.P_CROSSOVER = 0.8;
    this.SIZE_POPULATION = 300;
    this.SIZE_NEW_POPULATION = 1000;

    this.matches = matches;
    this.playgrounds = playgrounds;
    this.teams = teams;

    this.nMatches = matches.length;
    this.nPlaygrounds = playgrounds.length;
    this.maxRounds = Math.floor(this.nMatches / this.nPlaygrounds) + 1;

    this.fitnessComputers = [];
}

MatchOptimizer.prototype.computeFitness = function(solution) {
    var fitness = 0.0;
    var totalImporatnce = 0.0;

    for(var i = 0; i < this.fitnessComputers.length; i++) {
        var item = this.fitnessComputers[i];
        var fitnessComputer = item.computer;
        var importance = item.importance;

        fitness += importance * fitnessComputer(solution);
        totalImporatnce += importance;
    }

    return fitness / totalImporatnce;
};

MatchOptimizer.prototype.addFitness = function(fitnessComputer, importance) {
    this.fitnessComputers.push({
        computer: fitnessComputer,
        importance: importance
    });
};

// Create a random scheduling solution. It is not a solution that fits all the
// requirements, but it has the form of solution.
//
// A solution is the array of rounds for matches. E.g. [2, 2, 1, 3, 1] means
// that the first match will be played in the scond round, the third match in
// the first round, ...
MatchOptimizer.prototype.createRandomSolution = function() {
    var solution = new Solution(this);
    for(var i = 0; i < this.nMatches; i++) {
      solution.values[i] = randInt(this.maxRounds);
    }
    solution.shuffle();
    return solution;
};

// Choose one randomly.
MatchOptimizer.prototype.chooseOne = function(population) {
    var chosenInt = randInt(population.length);
    var chosen = population[chosenInt];
    // console.debug("Chosen:", chosen, chosenInt);
    return chosen.clone();
};

MatchOptimizer.prototype.mutationClone = function(newPopulation, population) {
    // Just pick a member and copy it over to the new population.
    var clonedMember = this.chooseOne(population);
    newPopulation.push(clonedMember);
};

MatchOptimizer.prototype.mutationCrossover = function(newPopulation,
        population) {
    var member1 = this.chooseOne(population);
    var member2 = this.chooseOne(population);

    if(member1.length !== member2.length) {
        throw new Error();
    }

    crossOverPoint = randInt(member1.length);

    var newMember1 = member1.crossover(member2, crossOverPoint);
    var newMember2 = member2.crossover(member1, crossOverPoint);

    newPopulation.push(newMember1);
    newPopulation.push(newMember2);
};

MatchOptimizer.prototype.mutationMutate = function(newPopulation, population) {
    var mutatedMember = this.chooseOne(population);

    var nChanges = 2;
    for(var y = 0; y < nChanges; y++) {
      mutatedMember[randInt(mutatedMember.length)] = randInt(this.maxRounds);
    }

    newPopulation.push(mutatedMember);
};

// Mutate the population according to the laws of genetic algorithms.
MatchOptimizer.prototype.makeMutation = function(population) {
    var newPopulation = [];

    while(newPopulation.length < this.SIZE_NEW_POPULATION) {
        var choice = Math.random();

        // Clone.
        if(choice < this.P_CLONE) {
            this.mutationClone(newPopulation, population);
        }
        // Cross-over.
        else if (choice < this.P_CLONE + this.P_CROSSOVER) {
            this.mutationCrossover(newPopulation, population);
        }
        // Mutate.
        else {
            this.mutationMutate(newPopulation, population);
        }
    }

    for(var i = 0; i < newPopulation.length; i++) {
        newPopulation[i].fitness = this.computeFitness(newPopulation[i]);
    }

    return newPopulation;
};

// Mutate the population according to the laws of genetic algorithms.
MatchOptimizer.prototype.makeMutation2 = function(population) {
    var newPopulation = [];
    var delta = this.nMatches;
    var keyFn = function(solution) { return solution.values; };
    var i;

    while(newPopulation.length < this.SIZE_NEW_POPULATION) {
        for(i = 0; i < this.nMatches / 2; i++) {
            var p1 = this.chooseOne(population);
            var p2 = this.chooseOne(population);

            crossOverPoint = randInt(p1.length);
            var newP1 = p1.crossover(p2, crossOverPoint);
            var newP2 = p2.crossover(p1, crossOverPoint);

            /*crossOverPoint = crossOverPoint + randInt(p1.length -
                crossOverPoint);
            newP1 = newP1.crossover(p2, crossOverPoint);
            newP2 = newP2.crossover(p1, crossOverPoint);*/

            newPopulation.push(newP1);
            newPopulation.push(newP2);
        }

        //this.mutationMutate(newPopulation, population);

        for(i = 0; i < newPopulation.length; i++) {
            newPopulation[i].fitness = this.computeFitness(newPopulation[i]);
        }

        var totalPopulation = newPopulation.concat(population);

        this.sortPopulation(totalPopulation);

        return totalPopulation.slice(0, this.SIZE_NEW_POPULATION);
    }

    return newPopulation;
};

MatchOptimizer.prototype.sortPopulation = function(population) {
    population.sort(function(a,b) {
        if(a.fitness > b.fitness) {
            return -1;
        } else {
            return 1;
        }
    });
};

// Breed the population. Make the good ones survive, kill the rest.
MatchOptimizer.prototype.killOut = function(population) {
    this.sortPopulation(population);

    // Keep only the best N.
    return population.slice(0, this.SIZE_POPULATION);
};

MatchOptimizer.prototype.createInitialPopulation = function() {
    // Create a new random population.
    var population = [];
    for(var i = 0; i < this.SIZE_POPULATION; i++) {
      population.push(this.createRandomSolution());
    }
    return population;
};

MatchOptimizer.prototype.computePopulationFitness = function(population) {
    return population[0].fitness;
    /*
    var totalFitness = 0.0;
    for(var i = 0; i < population.length; i++) {
        totalFitness += population[i].fitness;
    }
    return totalFitness;*/
};


MatchOptimizer.prototype.run = function() {
    var population = this.createInitialPopulation();

    var iNum = 0;
    var nonImprovedRounds = 0;

    // While the total fitness decreases or we passed a threshold, mutate.
    var newFitness;
    var lastFitness = this.computePopulationFitness(population);
    var newPopulation;

    console.debug("Last fitness: %.2f", lastFitness);
    while(true) {
      newPopulation = this.makeMutation2(population);
      population = this.killOut(newPopulation);
      newFitness = this.computePopulationFitness(population);

      // Check if we are still improving the population fitness.
      if(newFitness <= lastFitness) {
        nonImprovedRounds += 1;
      } else {
        nonImprovedRounds = 0;
      }
      lastFitness = newFitness;

      //console.debug(iNum + ": new fitness:", newFitness, population[0].fitness);

      iNum += 1;

      // Hard limit on number of rounds so that we don't get stuck here.
      if(nonImprovedRounds > 100 || iNum > 1000) {
        break;
      }
    }

    for(var p in population) {
        //console.debug(population[p].values);
    }

    population[0].transfer();

    console.debug("#1 " + noTeamPlaysTwiceEachRound(population[0]));
    console.debug("#2 " + eachRoundHasSameNumberOfMatches(population[0]));
    return population[0].fitness;
};