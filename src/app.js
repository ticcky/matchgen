/**
 * Auxiliary functions
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function getDefault(obj, key, def) {
  if(!(key in obj)) {
    obj[key] = def;
  }
  return obj[key];
}

function randInt(len) {
  return Math.floor(Math.random() * len);
}

function getLocalOrCreate(name) {
  var res = localStorageService.get(name);
  if(res === null) {
    return [];
  }
  else {
    return res;
  }
}


function optimizeMatches(matches, playgrounds, teams) {
  /*
  var SIZE_POPULATION = 30;
  var SIZE_NEW_POPULATION = 100;
  var REPRODUCE_FROM_BEST_N = 10;

  var nMatches = matches.length;
  var nPlaygrounds = playgrounds.length;
  var maxRounds = Math.floor(nMatches / nPlaygrounds) + 1;



  // Asses fitness of the given solution.
  // fitness < 0 : unacceptable
  // fitness >= 0 : acceptable; the higher the better
  var computeFitness = function(solution) {
    var result = 0;
    var rounds = {};
    var teamRounds = {};
    var i, y, t;
    var match;

    for(i = 0; i < solution.length; i++) {
      if(rounds[solution[i]] === undefined) {
        rounds[solution[i]] = [];
      }

      rounds[solution[i]].push(i);

      match = matches[i];

      var t1rounds = getDefault(teamRounds, match.team1.id, []);
      var t2rounds = getDefault(teamRounds, match.team2.id, []);
      t1rounds.push(solution[i]);
      t2rounds.push(solution[i]);
    }
    solution.rounds = rounds;

    // Discount each round that does not have the desired number of matches.
    for(i = 0; i < maxRounds; i++) {
      if(rounds[i] !== undefined) {
        if(rounds[i].length != nPlaygrounds) {
          result -= 1.0;
        }
      } else {
        result -= 1.0;
      }
    }

    // Discount each round that contains overlapping teams.
    for(i = 0; i < maxRounds; i++) {
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
        // console.debug("Round " + i + " " + nonOverlapping);
        rounds[i].overlapping = !nonOverlapping;
        if(!nonOverlapping) {
          result -= Math.pow(rounds[i].length, 2);
        }
      }
    }

    // Discount unequal breaks between matches.
    teamStops = [];
    stopsTotal = 0;
    for(t = 0; t < teams.length; t++) {
      for(i = 0; i < teamRounds[t].length - 1; i++) {
        for(y = i + 1; y < teamRounds[t].length; y++) {
          //console.debug(t + ": " + teamRounds[t] + " " + teamRounds[t][y] + " " + teamRounds[t][i]);
          var val = Math.abs(teamRounds[t][y] - teamRounds[t][i]);
          teamStops.push(val);
          stopsTotal += val;
        }
      }
    }

    var idealStop = 1.0 * stopsTotal / teamStops.length;
    var stopPenalty = 0;
    for(i = 0; i < teamStops.length; i++) {
      stopPenalty += Math.abs(teamStops[i] - idealStop);
    }

    result -= stopPenalty / 10.0;
    console.debug("stop penalty: " + stopPenalty);

    //var minStop = Math.min.apply(null, teamStops);
    //var maxStop = Math.max.apply(null, teamStops);
    //result -= (maxStop - minStop);

    solution.teamStops = teamStops;
    //console.debug(teamStops);
    //console.debug(maxStop - minStop);

    solution.fitness = result;
  };




  var computePopulationFitness = function(population) {
    var totalFitness = 0.0;
    for(var i = 0; i < population.length; i++) {
      totalFitness += population[i].fitness;
    }
    return totalFitness;
  };

  // Choose one randomly.
  var chooseOne = function(population) {
    var chosenInt = randInt(population.length);
    var chosen = population[chosenInt];
    // console.debug("Chosen:", chosen, chosenInt);
    var val = [];
    for(var i = 0; i < chosen.length; i++) {
      val.push(chosen[i]);
    }
    return val;
  };
  */


/*


  // Save.
  var theOne = population[0];
  console.debug("Selecting ", theOne.fitness);
  console.debug(theOne);
  console.debug(matches);
  console.debug(theOne.teamStops);

  var roundPlaygrounds = {};

  for(i = 0; i < theOne.length; i++) {
    matches[i].round = theOne[i];
    if(roundPlaygrounds[theOne[i]] === undefined) {
      roundPlaygrounds[theOne[i]] = [];
    }

    matches[i].playground = playgrounds[roundPlaygrounds[theOne[i]].length];
    roundPlaygrounds[theOne[i]].push(i);
  }*/



  var optimizer = new MatchOptimizer(matches, playgrounds, teams);
  optimizer.addFitness(noTeamPlaysTwiceEachRound, 1.0);
  optimizer.addFitness(eachRoundHasSameNumberOfMatches, 1.0);

  var cnt = 0.0;
  var avg = 0.0;
  for(var i = 0; i < 1; i++) {
    avg += optimizer.run();
    cnt += 1;
  }

  console.debug(avg / cnt);


}

var tournamentApp = angular.module('tournament', [
  'LocalStorageModule',
  'templates-app',
  'ui.router'
])

.factory('misc', function (localStorageService) {
  return {
    getLocalOrCreate: function (name) {
      var res = localStorageService.get(name);
      if(res === null) {
        return [];
      }
      else {
        return res;
      }
    },
    saveLocal: function(name, value) {
      localStorageService.add(name, value);
    }
  };
})

.factory('model_Teams', function (misc) {
  var teams = misc.getLocalOrCreate('teams');
  for(var i = 0; i < teams.length; i++) {
    teams[i].id = i;
  }

  var self = {
    all: teams,
    create : function() {
      teams.push({
        id: teams.length,
        name: '',
        skill: '',
        group: ''
      });
      self.save();
    },
    removeTeam: function(idx) {
      var res = teams.pop(idx);
      self.save();

      return res;
    },
    save: function() {
      misc.saveLocal('teams', teams);
    }
  };

  return self;
})

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  // Default route.
  $urlRouterProvider.otherwise( '/teams' );

  // Set other pages.
  $stateProvider
    .state( 'teams', {
      url: '/teams',
      views: {
        "main": {
          controller: 'TeamsCtrl',
          templateUrl: 'teams.tpl.html'
        }
      },
      data:{ pageTitle: 'Teams' }
    })
    .state( 'playgrounds', {
      url: '/playgrounds',
      views: {
        "main": {
          controller: 'PlaygroundsCtrl',
          templateUrl: 'playgrounds.tpl.html'
        }
      },
      data:{ pageTitle: 'Playgrounds' }
    })
    .state( 'matches', {
      url: '/matches',
      views: {
        "main": {
          controller: 'MatchesCtrl',
          templateUrl: 'matches.tpl.html'
        }
      },
      data:{ pageTitle: 'Matches' }
    });
})

.run( function run () {
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | Tournament' ;
    }
  });
})

.controller( 'TeamsCtrl', function TeamsController( $scope, misc, model_Teams ) {
  $scope.teams = model_Teams;
})

.controller( 'PlaygroundsCtrl', function PlaygroundsController( $scope, misc ) {
  $scope.playgrounds = misc.getLocalOrCreate('playgrounds');
  $scope.createPlayground = function() {
    $scope.playgrounds.push({name: ''});
    $scope.save();
  };
  $scope.removePlayground = function(idx) {
    var res = $scope.playgrounds.pop(idx);
    $scope.save();

    return res;
  };
  $scope.save = function() {
    misc.saveLocal('playgrounds', $scope.playgrounds);
  };
})

.controller( 'MatchesCtrl', function MatchesController( $scope, misc, model_Teams ) {
  $scope.matches = [];
  $scope.generateMatches = function() {
    // Clear matches.
    $scope.matches = [];

    var playgrounds = misc.getLocalOrCreate('playgrounds');
    var teams = model_Teams.all;

    var groups = {};
    for(var i = 0; i < teams.length; i++) {
      if(!(teams[i].group in groups)) {
        groups[teams[i].group] = [];
      }
      groups[teams[i].group].push(teams[i]);
    }

    for(var g in groups) {
      var group = groups[g];
      for(i = 0; i < group.length; i++) {
        for(var y = i + 1; y < group.length; y++) {
          $scope.matches.push({
            teams: [group[i].id, group[y].id],
            team1: group[i],
            team2: group[y],
            order: -1,
            playground: -1,
            group: g
          });
        }
      }
    }

    optimizeMatches($scope.matches, playgrounds, teams);

    $scope.matches.sort(function(m1, m2) {
      if(m1.round > m2.round) {
        return 1;
      } else {
        return -1;
      }
    });
  };
})

;

/*
.controller('PlayerListCtrl', [
  '$scope',
  'localStorageService',
  function($scope, localStorageService) {
    var players = $scope.players = getLocalOrCreate('players');
    var playgrounds = $scope.playgrounds = getLocalOrCreate('playgrounds');

    $scope.editPlayers = true;
    $scope.groups = {};

    $scope.refreshGroups = function() {
      // Extract groups from the list of players.
      $scope.groups = {};
      for(var i in players) {
        var p = players[i];
        if($scope.groups[p.group] === undefined) {
          $scope.groups[p.group] = [];
        }
        $scope.groups[p.group].push(p);
      }
    }

    $scope.refreshGroups();



    $scope.save = function() {
      $scope.refreshGroups();
      localStorageService.add('players', players);
      localStorageService.add('playgrounds', playgrounds);
      console.debug(players);
    }

    $scope.setEditPlayers = function(what) {
      $scope.editPlayers = what;
    }

    $scope.createPlayer = function() {
      players.push({'name': '', 'id': players.length, 'skill': 0, 'group': '0'});
    }

    $scope.createPlayground = function() {
      playgrounds.push({'name': ''});
    }

    $scope.removePlayer = function(idx) {
      $scope.players.splice(idx, 1);
    }

    $scope.removePlayground = function(idx) {
      $scope.playgrounds.splice(idx, 1);
    }

    $scope.computeCost = function(matches) {
      var cost = 0;
      // 1 player plays 2 matches.
      var last1 = null;
      var last2 = null
      for(var i = 1; i < matches.length; i++) {
        var curr1 = matches[i].team1;
        var curr2 = matches[i].team2;
        if(last1 == curr1 || last1 == curr2 || last2 == curr1 || last2 == curr2) {
          cost += 10;
        }
        last1 = curr1;
        last2 = curr2;
      }

      return cost;
    }

    $scope.generateMatches = function() {
      $scope.refreshGroups();
      var groupMatches = {};
      for(var i in $scope.groups) {
        groupMatches[i] = [];
        var group = $scope.groups[i];
        var nTeams = group.length;
        for(var t1 = 0; t1 < nTeams; t1++) {
          for(var t2 = t1 + 1; t2 < nTeams; t2++) {
            groupMatches[i].push({'playground': nTeams, 'team1': group[t1], 'team1_points': 0, 'team2': group[t2], 'team2_points': 0});
          }
        }
      }

      $scope.matches = {};
      var playgroundCnt = playgrounds.length;
      var playgroundPtr = 0;
      for(var i = 0; i < playgroundCnt; i++) {
        $scope.matches[i] = [];
      }
      var groupPtr = 0;
      var blankCntr = 0;
      while(true) {
        console.debug(groupPtr + " " + playgroundPtr + " " + $scope.groups.length);
        if(blankCntr == $scope.groups.size)
          break;
        if(groupMatches[groupPtr].length == 0) {
          groupPtr = (groupPtr + 1) % $scope.groups.size;
          blankCntr += 1;
        }
        blankCntr = 0;
        var match = groupMatches[groupPtr].pop();
        $scope.matches[playgroundPtr].push(match);

        groupPtr = (groupPtr + 1) % $scope.groups.size;
        playgroundPtr = (playgroundPtr + 1) % playgroundCnt;
      }





      //shuffleArray($scope.matches);

      // Optimize.
      alert($scope.computeCost($scope.matches));
    }
  }]);
  */